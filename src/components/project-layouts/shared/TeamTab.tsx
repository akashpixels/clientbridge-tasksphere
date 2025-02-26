
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
          console.log('Current user role:', userData.user_role?.name);
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
      console.log('Fetching team members for project:', projectId);
      
      // First get the project details to get the client_id
      const { data: project } = await supabase
        .from('projects')
        .select(`
          client_id,
          client:clients(
            user_profiles:user_profiles(
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
          )
        `)
        .eq('id', projectId)
        .single();

      console.log('Project and client data:', project);

      if (!project) return [];

      // Get client admin from user_profiles where client_id matches and role is client_admin
      const { data: clientAdmins } = await supabase
        .from('user_profiles')
        .select(`
          id,
          first_name,
          last_name,
          username,
          user_role:user_roles!inner(name),
          job_role:job_roles(name),
          client:clients!inner(
            id,
            business_name
          )
        `)
        .eq('client_id', project.client_id)
        .eq('user_role.name', 'client_admin');

      console.log('Client admins:', clientAdmins);

      // Get agency admins
      const { data: agencyAdmins } = await supabase
        .from('user_profiles')
        .select(`
          id,
          first_name,
          last_name,
          username,
          user_role:user_roles!inner(name),
          job_role:job_roles(name),
          client:clients(
            id,
            business_name
          )
        `)
        .eq('user_role.name', 'agency_admin');

      console.log('Agency admins:', agencyAdmins);

      // Combine all users and remove duplicates
      let allUsers = [
        ...(clientAdmins || []),
        ...(agencyAdmins || [])
      ].filter(Boolean);

      console.log('Combined users before filtering:', allUsers);

      // Remove duplicates based on user ID
      allUsers = allUsers.filter((user, index, self) =>
        index === self.findIndex((u) => u?.id === user?.id)
      );

      // Filter users based on role
      if (userRole === 'client_admin') {
        // Show only users from their client
        allUsers = allUsers.filter(user => user.client?.id === clientId);
      } else if (userRole === 'client_staff') {
        // Show only client admin and staff from their client
        allUsers = allUsers.filter(
          user => 
            user.client?.id === clientId && 
            ['client_admin', 'client_staff'].includes(user.user_role.name)
        );
      } else if (userRole === 'agency_staff') {
        // Don't show the team tab
        return [];
      }
      
      console.log('Final filtered users:', allUsers);
      return allUsers;
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
