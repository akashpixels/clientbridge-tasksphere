
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MaintenanceLayout from "@/components/project-layouts/MaintenanceLayout";
import BrandingLayout from "@/components/project-layouts/BrandingLayout";
import DevelopmentLayout from "@/components/project-layouts/DevelopmentLayout";
import DefaultLayout from "@/components/project-layouts/DefaultLayout";
import { Loader2, AlertCircle } from "lucide-react";

const ProjectDetails = () => {
  const { id } = useParams();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      console.log('Fetching project details for ID:', id);
      
      if (!id) {
        throw new Error('Project ID is required');
      }
      
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
            next_renewal_date,
            billing_cycle
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        throw error;
      }
      
      console.log('Fetched project data:', data);
      
      // Direct query to check subscription data
      const { data: subscriptionData, error: subError } = await supabase
        .from('project_subscriptions')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
        
      if (subError) {
        console.error('Error fetching subscriptions separately:', subError);
      } else {
        console.log('Direct subscription data:', subscriptionData);
      }
      
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-lg">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Project</h2>
          <p className="text-gray-600 mb-4">{(error as Error).message}</p>
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-left">
            <p>Project ID: {id}</p>
            <p className="mt-1">Please check your network connection and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Project Not Found</h2>
          <p className="text-gray-600">The requested project could not be found.</p>
          <p className="text-sm text-gray-500 mt-4">ID: {id}</p>
        </div>
      </div>
    );
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
