
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
      
      // 1. Fetch base project data
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
      
      // 2. Determine if we should use historical data
      if (!isCurrentMonth && isBefore(selectedDate, currentDate)) {
        console.log('Looking up historical data for past month:', selectedMonth);
        
        // Try to fetch data from subscription_usage table
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
          // No historical data found, calculate from tasks
          console.log('No historical data found, calculating from tasks for month:', selectedMonth);
          
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('actual_hours_spent')
            .eq('project_id', id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

          if (tasksError) {
            console.error('Error calculating historical data from tasks:', tasksError);
          } else {
            // Calculate total hours spent from tasks
            monthlyHours = tasksData ? 
              tasksData.reduce((sum, task) => sum + (task.actual_hours_spent || 0), 0) : 
              0;
            
            dataSource = "calculated";
            console.log('Calculated hours for past month from tasks:', monthlyHours);
          }
        }
      } 
      // 3. For current month or future months, use live calculation
      else {
        console.log('Using live calculation for month:', selectedMonth);
        
        // Fetch tasks for the selected month
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('actual_hours_spent')
          .eq('project_id', id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (tasksError) {
          console.error('Error fetching tasks data:', tasksError);
        } else {
          // Calculate total hours spent from tasks
          monthlyHours = tasksData ? 
            tasksData.reduce((sum, task) => sum + (task.actual_hours_spent || 0), 0) : 
            0;
          
          dataSource = "live";
          console.log('Calculated live hours:', monthlyHours);
        }
      }

      // 4. Enhance project with subscription data
      const enhancedProject = {
        ...projectData,
        subscription_data: {
          hours_spent: monthlyHours,
          hours_allotted: hoursAllotted,
          data_source: dataSource,
        },
        project_subscriptions: projectData.project_subscriptions?.map(subscription => ({
          ...subscription,
          // Add calculated data for compatibility with existing components
          hours_spent: monthlyHours
        }))
      };
      
      console.log('Enhanced project data:', enhancedProject);
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
