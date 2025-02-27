
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Team = () => {
  const { session } = useAuth();

  const { data: currentUserRole } = useQuery({
    queryKey: ['current-user-role'],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_role_id')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return data?.user_role_id;
    },
  });

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members', currentUserRole],
    enabled: !!currentUserRole,
    queryFn: async () => {
      if (!session?.user?.id) return [];

      let query = supabase
        .from('user_profiles')
        .select(`
          id,
          first_name,
          last_name,
          username,
          user_role_id,
          user_role:user_roles(id, name),
          job_role:job_roles(name),
          client:clients(id, business_name)
        `);

      // For agency admin (role_id = 1), show all agency staff and admin
      if (currentUserRole === 1) {
        query = query.in('user_role_id', [1, 2]); // Agency Admin (1) and Agency Staff (2) roles
      }
      // For client admin (role_id = 3), show only their client's staff
      else if (currentUserRole === 3) {
        const { data: clientId } = await supabase
          .from('user_profiles')
          .select('client_id')
          .eq('id', session.user.id)
          .single();

        if (clientId?.client_id) {
          query = query.eq('client_id', clientId.client_id);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching team members:', error);
        return [];
      }

      console.log('Fetched team members:', data);
      return data;
    },
  });

  if (!currentUserRole || ![1, 3].includes(currentUserRole)) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <p className="text-center text-gray-500">
            You don't have permission to view this page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Team Members</h1>
      <Card className="p-6">
        {isLoading ? (
          <p className="text-center">Loading team members...</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Job Role</TableHead>
                  {currentUserRole === 1 && <TableHead>Client</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers && teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
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
                      {currentUserRole === 1 && (
                        <TableCell>
                          {member.client?.business_name || 'Agency Staff'}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={currentUserRole === 1 ? 5 : 4}
                      className="text-center text-muted-foreground"
                    >
                      No team members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Team;
