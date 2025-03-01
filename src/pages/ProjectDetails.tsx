
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MaintenanceLayout from "@/components/project-layouts/MaintenanceLayout";
import BrandingLayout from "@/components/project-layouts/BrandingLayout";
import DevelopmentLayout from "@/components/project-layouts/DevelopmentLayout";
import DefaultLayout from "@/components/project-layouts/DefaultLayout";

const ProjectDetails = () => {
  const { id } = useParams();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      console.log('Fetching project details for ID:', id);
      
      // First fetch the project with all related data
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
            hours_spent,
            next_renewal_date
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        throw error;
      }

      // Validate that the main project data exists
      if (!data) {
        throw new Error("Project not found");
      }

      // Get current month in YYYY-MM-DD format (first day of month)
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      console.log('Fetching usage data for month:', currentMonth);

      // Log direct project subscription data for debugging
      console.log('Direct project subscriptions:', data.project_subscriptions);

      // Attempt direct query to verify table access
      try {
        const { data: testUsage, error: testError } = await supabase
          .from('project_subscription_usage')
          .select('*')
          .limit(5);
          
        console.log('Test query to project_subscription_usage:', testUsage);
        if (testError) {
          console.error('Test query error:', testError);
        }
      } catch (e) {
        console.error('Exception during test query:', e);
      }

      // Fetch project_subscription_usage for monthly hours
      const { data: usageData, error: usageError } = await supabase
        .from('project_subscription_usage')
        .select('hours_spent, project_subscription_id, month_year')
        .eq('project_id', id);

      if (usageError) {
        console.error('Error fetching usage data:', usageError);
      } else {
        console.log('All usage data fetched:', usageData);
        
        // Filter for February 2025 usage data specifically
        const febUsage = usageData?.filter(usage => 
          usage.month_year.startsWith('2025-02')
        );
        console.log('February usage data:', febUsage);
      }

      // Create a map of subscription_id to hours_spent
      const usageMap = {};
      if (usageData && usageData.length > 0) {
        usageData.forEach(usage => {
          usageMap[usage.project_subscription_id] = usage.hours_spent;
          console.log(`Mapping subscription ${usage.project_subscription_id} to ${usage.hours_spent} hours`);
        });
      } else {
        console.log('No usage data found for this project');
      }

      // Ensure project_subscriptions is an array before processing
      const subscriptions = Array.isArray(data.project_subscriptions) ? data.project_subscriptions : [];
      
      // Add the hours_spent property to project_subscriptions
      const enhancedProject = {
        ...data,
        project_subscriptions: subscriptions.map(sub => {
          // Make sure sub is a valid object before trying to spread it
          if (sub && typeof sub === 'object') {
            return {
              ...sub,
              // Use usage data if available for this subscription, otherwise use existing or default to 0
              hours_spent: usageMap[sub.id] !== undefined ? usageMap[sub.id] : (sub.hours_spent || 0)
            };
          }
          return sub;
        })
      };
      
      console.log('Enhanced project data with usage info:', enhancedProject);
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
  console.log('Project subscriptions before rendering:', project.project_subscriptions);
  
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
