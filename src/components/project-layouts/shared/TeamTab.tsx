
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface TeamTabProps {
  projectId: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
  phone?: string;
  user_role: { name: string };
  job_role: { name: string } | null;
  client: {
    id: string;
    business_name: string;
  } | null;
}

const TeamTab = ({ projectId }: TeamTabProps) => {
  const { session } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // Fetch current user's role and client_id
  useEffect(() => {
    const fetchUserRole = async () => {
      if (session?.user?.id) {
        const { data: userData, error } = await supabase
          .from('user_profiles')
          .select('user_role:user_roles(name), client_id')
          .eq('id', session.user.id)
          .single();

        if (!error && userData) {
          setUserRole(userData.user_role?.name);
          setClientId(userData.client_id);
        }
      }
    };
    fetchUserRole();
  }, [session]);

  // Fetch team members based on user role
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['project-team-members', projectId, userRole, clientId],
    queryFn: async () => {
      let query = supabase
        .from('project_assignees')
        .select(`
          user:user_profiles!project_assignees_user_id_fkey(
            id,
            first_name,
            last_name,
            username,
            user_role:user_roles(name),
            job_role:job_roles(name),
            client:clients(
              id,
              business_name
            )
          )
        `)
        .eq('project_id', projectId);

      const { data: assignees, error } = await query;
      
      if (error) {
        throw error;
      }

      // Get the project's client ID
      const { data: project } = await supabase
        .from('projects')
        .select('client_id')
        .eq('id', projectId)
        .single();

      if (!assignees) return [];

      // Filter users based on role
      let filteredUsers = assignees.map(a => a.user);

      if (userRole === 'client_admin') {
        // Show only users from their client
        filteredUsers = filteredUsers.filter(user => user.client?.id === clientId);
      } else if (userRole === 'client_staff') {
        // Show only client admin and staff from their client
        filteredUsers = filteredUsers.filter(
          user => 
            user.client?.id === clientId && 
            ['client_admin', 'client_staff'].includes(user.user_role.name)
        );
      } else if (userRole === 'agency_staff') {
        // Don't show the team tab
        return [];
      }
      
      return filteredUsers;
    },
    enabled: !!userRole && !!projectId,
  });

  // Don't show the team tab for agency staff
  if (userRole === 'agency_staff') {
    return null;
  }

  if (isLoading) {
    return <Card className="p-6">Loading team members...</Card>;
  }

  return (
    <Card className="p-6">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Job Role</TableHead>
              {userRole === 'agency_admin' && <TableHead>Client</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers?.map((member: UserProfile) => (
              <TableRow key={member.id}>
                <TableCell>
                  {member.first_name} {member.last_name}
                </TableCell>
                <TableCell>{member.username}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                    {member.user_role?.name.replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell>
                  {member.job_role?.name || 'Not assigned'}
                </TableCell>
                {userRole === 'agency_admin' && (
                  <TableCell>
                    {member.client?.business_name || 'Agency'}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {(!teamMembers || teamMembers.length === 0) && (
              <TableRow>
                <TableCell colSpan={userRole === 'agency_admin' ? 5 : 4} className="text-center text-muted-foreground">
                  No team members assigned to this project
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default TeamTab;
