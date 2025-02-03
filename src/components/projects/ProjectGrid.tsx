import { ProjectCard } from "./ProjectCard";
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

interface ProjectGridProps {
  projects: Project[];
}

export const ProjectGrid = ({ projects }: ProjectGridProps) => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-start">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};