
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TeamTabProps {
  projectId: string;
}

const TeamTab = ({ projectId }: TeamTabProps) => {
  // Fetch the client admin and team members for this project
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['project-team', projectId],
    queryFn: async () => {
      // First get the project's client_admin_id
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('client_admin_id')
        .eq('id', projectId)
        .single();
      
      if (projectError || !project?.client_admin_id) {
        console.error('Error fetching project:', projectError);
        return [];
      }
      
      console.log('Fetched project client_admin_id:', project.client_admin_id);
      
      // Get the client admin (user_role_id = 3)
      const { data: clientAdmin, error: adminError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          first_name,
          last_name,
          username,
          user_role:user_roles(id, name),
          job_role:job_roles(name)
        `)
        .eq('id', project.client_admin_id)
        .eq('user_role_id', 3) // client_admin role
        .single();
      
      if (adminError) {
        console.error('Error fetching client admin:', adminError);
        console.log('Client admin ID used for query:', project.client_admin_id);
        return [];
      }
      
      // Get project assignees if any
      const { data: assignees, error: assigneesError } = await supabase
        .from('project_assignees')
        .select(`
          user:user_profiles(
            id,
            first_name,
            last_name,
            username,
            user_role:user_roles(id, name),
            job_role:job_roles(name)
          )
        `)
        .eq('project_id', projectId);
      
      if (assigneesError) {
        console.error('Error fetching project assignees:', assigneesError);
        return clientAdmin ? [clientAdmin] : [];
      }
      
      // Combine client admin with assignees
      const allTeamMembers = [
        clientAdmin,
        ...(assignees?.map(a => a.user) || [])
      ].filter(Boolean);
      
      // Remove duplicates
      return allTeamMembers.filter((member, index, self) => 
        index === self.findIndex(m => m.id === member.id)
      );
    },
  });

  if (isLoading) {
    return <div>Loading team members...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Job Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers && teamMembers.length > 0 ? (
            teamMembers.map(member => (
              <TableRow key={member.id}>
                <TableCell>
                  {member.first_name} {member.last_name}
                </TableCell>
                <TableCell>{member.username}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                    {member.user_role?.name?.replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell>
                  {member.job_role?.name || 'Not assigned'}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No team members assigned to this project
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TeamTab;
