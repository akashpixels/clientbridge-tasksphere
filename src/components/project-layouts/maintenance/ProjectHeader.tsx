import { Tables } from "@/integrations/supabase/types";

interface ProjectHeaderProps {
  project: Tables<"projects"> & {
    client: {
      id: string;
      user_profiles: {
        first_name: string;
        last_name: string;
      } | null;
    } | null;
  };
}

const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        {project.logo_url && (
          <img 
            src={project.logo_url} 
            alt={`${project.name} logo`}
            className="w-16 h-16 object-contain rounded-lg"
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-gray-500">
            {project.client?.user_profiles ? 
              `${project.client.user_profiles.first_name} ${project.client.user_profiles.last_name}` 
              : 'No Client'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <div className="text-sm text-gray-500">Subscription</div>
          <span className="inline-block px-2 py-1 text-sm rounded-full bg-[#F2FCE2] text-green-700">
            Active
          </span>
        </div>
        <div>
          <div className="text-sm text-gray-500">Renews on</div>
          <div className="text-sm">1st April</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Billing Cycle</div>
          <div className="text-sm">Monthly</div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;