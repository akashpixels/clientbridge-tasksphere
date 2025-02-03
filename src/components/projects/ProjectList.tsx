import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
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

interface ProjectListProps {
  projects: Project[];
  onSort: (key: string) => void;
}

export const ProjectList = ({ projects, onSort }: ProjectListProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => onSort('client')}
                className="h-8 flex items-center gap-1"
              >
                Client
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => onSort('status')}
                className="h-8 flex items-center gap-1"
              >
                Status
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => onSort('subscription')}
                className="h-8 flex items-center gap-1"
              >
                Subscription
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => onSort('dueDate')}
                className="h-8 flex items-center gap-1"
              >
                Due Date
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
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
                {project.client?.user_profiles ? 
                  `${project.client.user_profiles.first_name} ${project.client.user_profiles.last_name}` 
                  : 'No Client'}
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
                  project.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.subscription_status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell>
                {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};