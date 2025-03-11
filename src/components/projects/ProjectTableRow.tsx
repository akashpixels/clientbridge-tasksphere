
import { TableCell, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

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

interface ProjectTableRowProps {
  project: Project;
}

export const ProjectTableRow = ({ project }: ProjectTableRowProps) => {
  const navigate = useNavigate();
  const subscription = project.project_subscriptions?.[0];

  return (
    <TableRow 
      className="cursor-pointer hover:bg-[#e8e3d9] transition-colors border-b border-gray-200"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <TableCell className="pl-4">
        <div className="flex items-center gap-3">
          {project.logo_url && (
            <img 
              src={project.logo_url} 
              alt={`${project.name} logo`}
              className="w-8 h-8 object-contain rounded"
            />
          )}
          {project.name}
        </div>
      </TableCell>
      <TableCell>
        {project.client_admin?.user_profiles ? 
          `${project.client_admin.user_profiles.first_name} ${project.client_admin.user_profiles.last_name}` : 
          project.client_admin?.business_name || 'No Client'}
      </TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell>
        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
          subscription?.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {subscription?.subscription_status === 'active' ? 'Active' : 'Inactive'}
        </span>
      </TableCell>
      <TableCell>
        {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'}
      </TableCell>
    </TableRow>
  );
};
