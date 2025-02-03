import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Database } from "@/integrations/supabase/types";

type Project = Database['public']['Tables']['projects']['Row'] & {
  client: {
    id: string;
    user_profiles: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
  status: {
    name: string;
    color_hex: string;
  } | null;
};

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const gradientStyle = {
    background: `linear-gradient(135deg, ${project.primary_color_hex || '#9b87f5'} 0%, ${project.secondary_color_hex || '#7E69AB'} 40%, #fcfcfc 70%)`,
    transformOrigin: 'bottom right',
  };

  return (
    <Link to={`/projects/${project.id}`}>
      <Card 
        className="p-6 hover:shadow-md transition-shadow overflow-hidden relative flex flex-col"
        style={{ aspectRatio: '10/15', height: '420px' }}
      >
        <div className="absolute inset-0 opacity-10" style={gradientStyle} />
        <div className="relative z-10 flex flex-col h-full">
          {project.logo_url && (
            <div className="mb-4 flex justify-center">
              <img 
                src={project.logo_url} 
                alt={`${project.name} logo`}
                className="w-16 h-16 object-contain rounded-lg"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                project.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {project.subscription_status === 'active' ? 'Active' : 'Inactive'}
              </span>
              {project.status?.name && (
                <span 
                  className="inline-block px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: `${project.status.color_hex}15`,
                    color: project.status.color_hex
                  }}
                >
                  {project.status.name}
                </span>
              )}
            </div>
          </div>

          <div className="mt-auto space-y-2">
            <p className="text-sm text-gray-500">
              {project.client?.user_profiles ? 
                `${project.client.user_profiles.first_name} ${project.client.user_profiles.last_name}` 
                : 'No Client'}
            </p>
            <div className="text-sm text-gray-500">
              Due Date: {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};