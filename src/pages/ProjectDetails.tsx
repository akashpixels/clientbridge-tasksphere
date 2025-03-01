
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MaintenanceLayout from "@/components/project-layouts/maintenance/MaintenanceLayout";
import BrandingLayout from "@/components/project-layouts/BrandingLayout";
import DevelopmentLayout from "@/components/project-layouts/DevelopmentLayout";
import DefaultLayout from "@/components/project-layouts/DefaultLayout";
import { format, startOfMonth, endOfMonth } from "date-fns";

const ProjectDetails = () => {
  const { id } = useParams();
  const currentMonth = format(new Date(), 'yyyy-MM');
  const startDate = startOfMonth(new Date(currentMonth));
  const endDate = endOfMonth(new Date(currentMonth));

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      console.log('Fetching project details for ID:', id);
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

      // Fetch monthly hours directly from the tasks table
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('actual_hours_spent')
        .eq('project_id', id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (tasksError) {
        console.error('Error fetching tasks data:', tasksError);
      }

      // Calculate total hours spent this month from tasks
      const monthlyHours = tasksData ? 
        tasksData.reduce((sum, task) => sum + (task.actual_hours_spent || 0), 0) : 
        0;

      console.log('Monthly hours from tasks:', monthlyHours);

      // Ensure project_subscriptions is an array
      const projectSubscriptions = data.project_subscriptions || [];
      
      // Create enhanced project with monthly hours
      const enhancedProject = {
        ...data,
        project_subscriptions: projectSubscriptions.map(subscription => ({
          ...subscription,
          hours_spent: monthlyHours // Add monthly hours to each subscription
        }))
      };
      
      console.log('Enhanced project data:', enhancedProject);
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
      return <MaintenanceLayout project={project} />;
    case 2:
      return <BrandingLayout project={project} />;
    case 3:
      return <DevelopmentLayout project={project} />;
    default:
      return <DefaultLayout project={project} />;
  }
};

export default ProjectDetails;
