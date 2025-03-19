
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MaintenanceLayout from "@/components/project-layouts/maintenance/MaintenanceLayout";
import BrandingLayout from "@/components/project-layouts/BrandingLayout";
import DevelopmentLayout from "@/components/project-layouts/DevelopmentLayout";
import DefaultLayout from "@/components/project-layouts/DefaultLayout";
import { format } from "date-fns";
import { useState } from "react";
import { HoursUsageProgress } from "@/components/projects/HoursUsageProgress";
import { MonthlyUsage } from "@/types/usage";
import { intervalToHours } from "@/lib/date-utils";

const ProjectDetails = () => {
  const { id } = useParams();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Helper function to fetch monthly usage data
  const fetchMonthlyUsage = async (projectId: string | undefined, monthYear: string): Promise<MonthlyUsage | null> => {
    if (!projectId) return null;
    
    try {
      // Try to fetch from subscription_usage table first - updated field name from month_year to billing_period
      const { data: usageData, error: usageError } = await supabase
        .from('subscription_usage')
        .select('allocated_duration, used_duration')
        .eq('project_id', projectId)
        .eq('billing_period', monthYear) // Updated from month_year to billing_period
        .maybeSingle();

      if (usageError) {
        console.error('Error fetching usage data:', usageError);
      }

      if (usageData) {
        // Convert interval objects to numbers using the helper function
        return {
          allocated_duration: intervalToHours(usageData.allocated_duration),
          used_duration: intervalToHours(usageData.used_duration)
        };
      }
      
      // Fallback: Calculate total hours spent for the month from tasks
      // This is a simplified version and may need to be expanded based on your business logic
      return {
        allocated_duration: 0, // Default value
        used_duration: 0     // Default value
      };
    } catch (error) {
      console.error('Error in fetchMonthlyUsage:', error);
      return null;
    }
  };

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id, selectedMonth],
    queryFn: async () => {
      console.log('Fetching project details for ID:', id, 'for month:', selectedMonth);
      
      // Fetch base project data with relationships
      const { data, error } = await supabase
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
            allocated_duration,
            next_renewal_date
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        throw error;
      }

      // Project data successfully fetched
      console.log('Project base data fetched:', data);
      
      // For usage data, we'll use a function rather than a view
      // because the view seems to be causing typing issues
      const usageData = await fetchMonthlyUsage(id, selectedMonth);
      console.log('Usage data for selected month:', usageData);
      
      // Construct the enhanced project object
      const projectData = data;
      const enhancedProject = {
        ...projectData,
        project_subscriptions: projectData.project_subscriptions?.map(subscription => ({
          ...subscription,
          // Use hours data from usage calculation if available, fallback to subscription data
          allocated_duration: usageData?.allocated_duration ?? subscription.allocated_duration,
          actual_duration: usageData?.used_duration ?? 0
        }))
      };
      
      console.log('Enhanced project with usage data:', enhancedProject);
      return enhancedProject;
    },
  });

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading project details...</div>;
  }

  if (!project) {
    return <div className="container mx-auto p-6">Project not found</div>;
  }

  console.log('Project layout:', project?.layout);
  
  // Get subscription data for the HoursUsageProgress component
  const subscription = project?.project_subscriptions?.[0];
  const hoursAllotted = intervalToHours(subscription?.allocated_duration) || 0;
  const hoursSpent = intervalToHours(subscription?.actual_duration) || 0;
  
  // Prepare layout props with HoursUsageProgress component
  const layoutProps = {
    project,
    selectedMonth,
    onMonthChange: setSelectedMonth,
    hoursUsageProgress: subscription ? (
      <HoursUsageProgress 
        hoursAllotted={hoursAllotted}
        hoursSpent={hoursSpent}
        selectedMonth={selectedMonth}
      />
    ) : null
  };
  
  // Render the appropriate layout based on the project's layout type
  const layoutId = project?.layout_id;
  
  switch (layoutId) {
    case 1:
      return <MaintenanceLayout {...layoutProps} />;
    case 2:
      return <BrandingLayout project={project} />;
    case 3:
      return <DevelopmentLayout project={project} />;
    default:
      return <DefaultLayout project={project} />;
  }
};

export default ProjectDetails;
