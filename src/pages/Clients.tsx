import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
const Clients = () => {
  const {
    session
  } = useAuth();
  const {
    data: currentUserRole
  } = useQuery({
    queryKey: ['current-user-role-clients'],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const {
        data,
        error
      } = await supabase.from('user_profiles').select('user_role_id').eq('id', session.user.id).single();
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      return data?.user_role_id;
    }
  });
  const {
    data: clientAdmins,
    isLoading
  } = useQuery({
    queryKey: ['client-admins'],
    enabled: currentUserRole === 1,
    // Only run for agency admins
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('user_profiles').select(`
          id,
          first_name,
          last_name,
          username,
          client_id,
          clients!user_profiles_client_id_fkey(business_name)
        `).eq('user_role_id', 3); // Only fetch client admins (role_id = 3)

      if (error) {
        console.error('Error fetching client admins:', error);
        return [];
      }
      console.log('Fetched client admins:', data);
      return data;
    }
  });

  // Redirect or show access denied message if not an agency admin
  if (currentUserRole !== 1) {
    return <div className="container mx-auto p-6">
        <Card className="p-6">
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              You don't have permission to view this page.
            </p>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Clients</h1>
      <Card>
   
        <CardContent>
          {isLoading ? <p className="text-center py-4">Loading client administrators...</p> : <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Client Business</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientAdmins && clientAdmins.length > 0 ? clientAdmins.map(admin => <TableRow key={admin.id}>
                        <TableCell>
                          {admin.first_name} {admin.last_name}
                        </TableCell>
                        <TableCell>{admin.username}</TableCell>
                        <TableCell>
                          {admin.clients?.business_name || 'Not assigned'}
                        </TableCell>
                      </TableRow>) : <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No client administrators found
                      </TableCell>
                    </TableRow>}
                </TableBody>
              </Table>
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default Clients;
