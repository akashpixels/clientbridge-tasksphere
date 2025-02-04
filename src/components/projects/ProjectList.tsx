import { Table, TableBody } from "@/components/ui/table";
import { Database } from "@/integrations/supabase/types";
import { ProjectTableHeader } from "./ProjectTableHeader";
import { ProjectTableRow } from "./ProjectTableRow";

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

interface ProjectListProps {
  projects: Project[];
  onSort: (key: string) => void;
}

export const ProjectList = ({ projects, onSort }: ProjectListProps) => {
  return (
    <div className="rounded-md border border-gray-200 bg-[#fcfcfc]">
      <Table>
        <ProjectTableHeader onSort={onSort} />
        <TableBody>
          {projects.map((project) => (
            <ProjectTableRow key={project.id} project={project} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};