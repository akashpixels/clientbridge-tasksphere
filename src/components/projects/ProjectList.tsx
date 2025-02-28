
import { Table, TableBody } from "@/components/ui/table";
import { ProjectTableHeader } from "./ProjectTableHeader";
import { ProjectTableRow } from "./ProjectTableRow";

type Project = {
  id: string;
  name: string;
  logo_url: string;
  due_date: string | null;
  client_admin: {
    id: string;
    business_name: string;
    user_profiles: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
  status: {
    name: string;
    color_hex: string;
  } | null;
  project_subscriptions?: {
    subscription_status: string;
  }[];
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
