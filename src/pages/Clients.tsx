
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

// Define the type for client admins
interface ClientAdmin {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  client_id: string | null;
  business_name: string | null;
}

const Clients = () => {
  const { session } = useAuth();

  const { data: currentUserRole } = useQuery({
    queryKey: ['current-user-role-clients'],
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
    }
  });

  const { data: clientAdmins, isLoading } = useQuery<ClientAdmin[]>({
    queryKey: ['client-admins'],
    enabled: currentUserRole === 1, // Only run for agency admins
    queryFn: async () => {
      // First, get users with role_id = 3 (client admins)
      const { data: userProfiles, error: userError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          first_name,
          last_name,
          username,
          client_id
        `)
        .eq('user_role_id', 3);
      
      if (userError) {
        console.error('Error fetching client admin users:', userError);
        return [];
      }
      
      // If we have user profiles, fetch the associated client business names
      if (userProfiles && userProfiles.length > 0) {
        // Get all client IDs to fetch
        const clientIds = userProfiles
          .filter(profile => profile.client_id)
          .map(profile => profile.client_id);
        
        if (clientIds.length > 0) {
          const { data: clients, error: clientError } = await supabase
            .from('clients')
            .select('id, business_name')
            .in('id', clientIds);
          
          if (clientError) {
            console.error('Error fetching client businesses:', clientError);
          } else {
            // Create a map of client IDs to business names for quick lookup
            const clientMap = new Map();
            clients.forEach(client => {
              clientMap.set(client.id, client.business_name);
            });
            
            // Add business names to the user profiles
            return userProfiles.map(profile => ({
              ...profile,
              business_name: profile.client_id ? clientMap.get(profile.client_id) : null
            })) as ClientAdmin[];
          }
        }
      }
      
      // Return the original user profiles if we couldn't fetch clients
      // Add the business_name property as null
      return (userProfiles || []).map(profile => ({
        ...profile,
        business_name: null
      })) as ClientAdmin[];
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
 
   {isLoading ? (
            <p className="text-center py-4">Loading client administrators...</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Client Business</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientAdmins && clientAdmins.length > 0 ? (
                    clientAdmins.map(admin => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          {admin.first_name} {admin.last_name}
                        </TableCell>
                        <TableCell>{admin.username}</TableCell>
                        <TableCell>
                          {admin.business_name || 'Not assigned'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        No client administrators found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
     

    </div>;
};

export default Clients;
