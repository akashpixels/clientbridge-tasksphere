
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MaintenanceLayout from "@/components/project-layouts/maintenance/MaintenanceLayout";
import BrandingLayout from "@/components/project-layouts/BrandingLayout";
import DevelopmentLayout from "@/components/project-layouts/DevelopmentLayout";
import DefaultLayout from "@/components/project-layouts/DefaultLayout";
import { format, startOfMonth, endOfMonth, isAfter, isSameMonth } from "date-fns";

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

      // Project data successfully fetched
      const projectData = data;
      const selectedDate = new Date(currentMonth);
      const currentDate = new Date();
      
      // If the selected month is current month or future, use live calculation
      if (isSameMonth(selectedDate, currentDate) || isAfter(selectedDate, currentDate)) {
        console.log('Using live calculation for current/future month:', currentMonth);
        
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

        console.log('Monthly hours calculated from tasks:', monthlyHours);

        // Ensure project_subscriptions is an array
        const projectSubscriptions = projectData.project_subscriptions || [];
        
        // Create enhanced project with monthly hours
        const enhancedProject = {
          ...projectData,
          project_subscriptions: projectSubscriptions.map(subscription => ({
            ...subscription,
            hours_spent: monthlyHours // Add monthly hours to each subscription
          }))
        };
        
        console.log('Enhanced project data for current month:', enhancedProject);
        return enhancedProject;
      } 
      // For past months, check the subscription_usage table
      else {
        console.log('Looking up historical data for month:', currentMonth);
        
        // Try to fetch data from subscription_usage table
        const { data: usageData, error: usageError } = await supabase
          .from('subscription_usage')
          .select('*')
          .eq('project_id', id)
          .eq('month_year', currentMonth)
          .maybeSingle();

        if (usageError) {
          console.error('Error fetching subscription usage data:', usageError);
        }

        // If we found historical data, use it
        if (usageData) {
          console.log('Found historical usage data:', usageData);
          
          // Ensure project_subscriptions is an array
          const projectSubscriptions = projectData.project_subscriptions || [];
          
          // Create enhanced project with historical usage data
          const enhancedProject = {
            ...projectData,
            project_subscriptions: projectSubscriptions.map(subscription => ({
              ...subscription,
              hours_spent: usageData.hours_spent,
              hours_allotted: usageData.hours_allotted // Use historical allocated hours
            }))
          };
          
          console.log('Enhanced project with historical data:', enhancedProject);
          return enhancedProject;
        } 
        // If no historical data found, fall back to task calculation
        else {
          console.log('No historical data found, falling back to task calculation');
          
          // Fetch monthly hours from tasks for the selected month
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('actual_hours_spent')
            .eq('project_id', id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

          if (tasksError) {
            console.error('Error fetching tasks data for past month:', tasksError);
          }

          // Calculate total hours spent for the month from tasks
          const monthlyHours = tasksData ? 
            tasksData.reduce((sum, task) => sum + (task.actual_hours_spent || 0), 0) : 
            0;

          console.log('Monthly hours calculated from tasks for past month:', monthlyHours);

          // Ensure project_subscriptions is an array
          const projectSubscriptions = projectData.project_subscriptions || [];
          
          // Create enhanced project with calculated monthly hours
          const enhancedProject = {
            ...projectData,
            project_subscriptions: projectSubscriptions.map(subscription => ({
              ...subscription,
              hours_spent: monthlyHours
            }))
          };
          
          console.log('Enhanced project data for past month (calculated):', enhancedProject);
          return enhancedProject;
        }
      }
    },
  });

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading project details...</div>;
  }

  if (!project) {
    return <div className="container mx-auto p-6">Project not found</div>;
  }

  // Debug information - display directly on this page before rendering the layout
  console.log('Project details before rendering layout:', project);
  const subscription = project.project_subscriptions?.[0];
  
  if (subscription) {
    return (
      <div className="container mx-auto">
        {/* Debug Panel */}
        <div className="bg-gray-100 p-4 mb-6 rounded-lg border border-gray-300">
          <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Project ID:</p>
              <p className="text-sm text-gray-600">{project.id}</p>
            </div>
            <div>
              <p className="font-medium">Project Name:</p>
              <p className="text-sm text-gray-600">{project.name}</p>
            </div>
            <div>
              <p className="font-medium">Subscription ID:</p>
              <p className="text-sm text-gray-600">{subscription.id}</p>
            </div>
            <div>
              <p className="font-medium">Subscription Status:</p>
              <p className="text-sm text-gray-600">{subscription.subscription_status}</p>
            </div>
            <div>
              <p className="font-medium">Hours Allotted:</p>
              <p className="text-sm text-gray-600">{subscription.hours_allotted}</p>
            </div>
            <div>
              <p className="font-medium">Hours Spent:</p>
              <p className="text-sm text-gray-600">{subscription.hours_spent?.toFixed(1) || "0"}</p>
            </div>
            <div>
              <p className="font-medium">Next Renewal:</p>
              <p className="text-sm text-gray-600">{subscription.next_renewal_date}</p>
            </div>
          </div>
        </div>
        
        {/* Render the normal layout below the debug panel */}
        {project.layout_id === 1 ? (
          <MaintenanceLayout project={project} />
        ) : project.layout_id === 2 ? (
          <BrandingLayout project={project} />
        ) : project.layout_id === 3 ? (
          <DevelopmentLayout project={project} />
        ) : (
          <DefaultLayout project={project} />
        )}
      </div>
    );
  }
  
  // If no subscription data, just render the layout without debug panel
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
