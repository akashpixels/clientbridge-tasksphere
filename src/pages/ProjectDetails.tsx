
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MaintenanceLayout from "@/components/project-layouts/maintenance/MaintenanceLayout";
import BrandingLayout from "@/components/project-layouts/BrandingLayout";
import DevelopmentLayout from "@/components/project-layouts/DevelopmentLayout";
import DefaultLayout from "@/components/project-layouts/DefaultLayout";
import { format, startOfMonth, endOfMonth, isAfter, isBefore, isSameMonth, parse } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ProjectDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  
  // Maintain selected month state
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // Calculate date ranges based on selected month
  const selectedDate = parse(selectedMonth, 'yyyy-MM', new Date());
  const startDate = startOfMonth(selectedDate);
  const endDate = endOfMonth(selectedDate);
  const currentDate = new Date();
  const isCurrentMonth = isSameMonth(selectedDate, currentDate);
  
  // Log selected month for debugging
  console.log('Selected month:', selectedMonth, 'Is current month:', isCurrentMonth);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id, selectedMonth],
    queryFn: async () => {
      console.log('Fetching project details for ID:', id, 'Month:', selectedMonth);
      
      // 1. Fetch base project data with subscription data
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          client_admin:client_admins(
            id,
            business_name,
            user_profiles(
              first_name,
              last_name
            )
          ),
          status:task_statuses(name, color_hex),
          layout:project_layouts(id, name),
          project_subscriptions(
            id,
            subscription_status,
            hours_allotted,
            next_renewal_date
          )
        `)
        .eq('id', id)
        .single();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        toast({
          title: "Error loading project",
          description: projectError.message,
          variant: "destructive",
        });
        throw projectError;
      }
      
      // Early return if no project data
      if (!projectData) {
        throw new Error("Project not found");
      }

      console.log('Basic project data fetched:', projectData);
      
      let monthlyHours = 0;
      let hoursAllotted = projectData.project_subscriptions?.[0]?.hours_allotted || 0;
      let dataSource = "unknown";
      
      // Simple logic for subscription data:
      // - Current month: Calculate from tasks
      // - Past month: Get from subscription_usage
      
      if (isCurrentMonth) {
        // Current month - calculate hours from tasks
        console.log('Getting current month data from tasks');
        dataSource = "live";
        
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('actual_hours_spent')
          .eq('project_id', id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (tasksError) {
          console.error('Error fetching tasks data for current month:', tasksError);
        } else {
          // Calculate total hours spent from tasks
          monthlyHours = tasksData ? 
            tasksData.reduce((sum, task) => sum + (task.actual_hours_spent || 0), 0) : 
            0;
          
          console.log('Calculated live hours for current month:', monthlyHours);
        }
      } 
      else {
        // Past month - check subscription_usage
        console.log('Getting data for month:', selectedMonth, 'from subscription_usage');
        
        const { data: usageData, error: usageError } = await supabase
          .from('subscription_usage')
          .select('*')
          .eq('project_id', id)
          .eq('month_year', selectedMonth)
          .maybeSingle();

        if (usageError) {
          console.error('Error fetching historical usage data:', usageError);
        }

        // If we found historical data, use it
        if (usageData) {
          console.log('Found historical usage data:', usageData);
          monthlyHours = usageData.hours_spent || 0;
          hoursAllotted = usageData.hours_allotted || 0;
          dataSource = "historical";
        } else {
          // We don't have historical data - set to 0 for clarity
          console.log('No historical data found for month:', selectedMonth);
          monthlyHours = 0;
          dataSource = "no data";
        }
      }

      // Create our enhanced project object with all the needed data
      // First, add the subscription_data
      const enhancedProject = {
        ...projectData,
        subscription_data: {
          hours_spent: monthlyHours,
          hours_allotted: hoursAllotted,
          data_source: dataSource,
        }
      };
      
      // Now enhance the project_subscriptions array to include the hours_spent field
      // that the ProjectHeader component expects
      if (enhancedProject.project_subscriptions && enhancedProject.project_subscriptions.length > 0) {
        enhancedProject.project_subscriptions = enhancedProject.project_subscriptions.map(sub => ({
          ...sub,
          hours_spent: monthlyHours // Add hours_spent to match the expected type
        }));
      } else {
        // Ensure we have at least an empty array if no subscriptions
        enhancedProject.project_subscriptions = [];
      }
      
      console.log('Enhanced project data with subscription info:', enhancedProject);
      return enhancedProject;
    },
  });

  // Handle monthly change from ProjectHeader
  const handleMonthChange = (month: string) => {
    console.log('Month changed to:', month);
    setSelectedMonth(month);
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading project details...</div>;
  }

  if (!project) {
    return <div className="container mx-auto p-6">Project not found</div>;
  }

  // Extract subscription info for current UI pattern
  const monthlyHours = project.subscription_data?.hours_spent || 0;
  
  console.log('Project layout:', project.layout);
  
  // Render the appropriate layout based on the project's layout type
  const layoutId = project.layout_id;
  
  switch (layoutId) {
    case 1:
      return <MaintenanceLayout 
        project={project} 
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        monthlyHours={monthlyHours}
      />;
    case 2:
      return <BrandingLayout project={project} />;
    case 3:
      return <DevelopmentLayout project={project} />;
    default:
      return <DefaultLayout project={project} />;
  }
};

export default ProjectDetails;
