
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  user_role: { name: string };
  job_role: { name: string } | null;
  client: {
    business_name: string;
  } | null;
}

const Team = () => {
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
    queryKey: ['team-members', userRole, clientId],
    queryFn: async () => {
      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          user_role:user_roles(name),
          job_role:job_roles(name),
          client:clients(business_name)
        `);

      // Apply filters based on user role
      if (userRole === 'client_admin') {
        query = query.eq('client_id', clientId);
      } else if (userRole === 'client_staff') {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    enabled: !!userRole,
  });

  // Don't show the team tab for agency staff
  if (userRole === 'agency_staff') {
    return null;
  }

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Team</h1>
      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
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
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="roles">
          <div className="grid gap-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">User Roles</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Agency Admin - Full access to all features and users</li>
                <li>Client Admin - Manage their organization's team and projects</li>
                <li>Agency Staff - Access to assigned projects and tasks</li>
                <li>Client Staff - Access to their organization's projects</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Team;
