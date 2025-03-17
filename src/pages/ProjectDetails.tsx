
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MaintenanceLayout from "@/components/project-layouts/maintenance/MaintenanceLayout";
import BrandingLayout from "@/components/project-layouts/BrandingLayout";
import DevelopmentLayout from "@/components/project-layouts/DevelopmentLayout";
import DefaultLayout from "@/components/project-layouts/DefaultLayout";
import { format } from "date-fns";
import { useState } from "react";
import { intervalToHours } from "@/lib/date-utils";

const ProjectDetails = () => {
  const { id } = useParams();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

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
            hours_allotted,
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
      
      // Fetch usage data from usage_view for the selected month
      const { data: usageData, error: usageError } = await supabase
        .from('usage_view')
        .select('hours_allotted, hours_spent')
        .eq('project_id', id)
        .eq('month_year', selectedMonth)
        .maybeSingle();

      if (usageError) {
        console.error('Error fetching usage data for selected month:', usageError);
      }

      console.log('Usage data for selected month:', usageData);
      
      // Construct the enhanced project object
      const projectData = data;
      const enhancedProject = {
        ...projectData,
        project_subscriptions: projectData.project_subscriptions?.map(subscription => ({
          ...subscription,
          // Convert hours data using our utility
          hours_allotted: intervalToHours(usageData?.hours_allotted ?? subscription.hours_allotted),
          hours_spent: intervalToHours(usageData?.hours_spent ?? 0)
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

  console.log('Project layout:', project.layout);
  
  // Render the appropriate layout based on the project's layout type
  const layoutId = project.layout_id;
  
  switch (layoutId) {
    case 1:
      return <MaintenanceLayout 
        project={project} 
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
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
