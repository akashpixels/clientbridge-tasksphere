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
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(
            id,
            user_profiles!clients_id_fkey(
              first_name,
              last_name
            )
          ),
          status:task_statuses(name, color_hex),
          layout:project_layouts(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading project details...</div>;
  }

  if (!project) {
    return <div className="container mx-auto p-6">Project not found</div>;
  }

  // Render the appropriate layout based on the project's layout type
  const layoutName = project.layout?.name?.toLowerCase() || 'default';
  
  switch (layoutName) {
    case 'maintenance':
      return <MaintenanceLayout project={project} />;
    case 'branding':
      return <BrandingLayout project={project} />;
    case 'development':
      return <DevelopmentLayout project={project} />;
    default:
      return <DefaultLayout project={project} />;
  }
};

export default ProjectDetails;