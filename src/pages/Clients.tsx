
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
  email: string;
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
      console.log("Fetching client admins...");
      
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
      
      console.log("User profiles fetched:", userProfiles);
      
      // Get all client IDs to fetch, including null check
      const clientIds = userProfiles
        .filter(profile => profile.client_id)
        .map(profile => profile.client_id);
      
      console.log("Client IDs to fetch:", clientIds);
      
      // Create a map to store client business names
      const clientMap = new Map();
      
      // Only fetch clients if we have client IDs
      if (clientIds.length > 0) {
        const { data: clients, error: clientError } = await supabase
          .from('clients')
          .select('id, business_name');
        
        if (clientError) {
          console.error('Error fetching client businesses:', clientError);
        } else {
          console.log("Clients fetched:", clients);
          
          // Create a map of client IDs to business names for quick lookup
          clients.forEach(client => {
            clientMap.set(client.id, client.business_name);
          });
        }
      }
      
      // Get email addresses from auth.users for each user profile
      const authIds = userProfiles.map(profile => profile.id);
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      console.log("Auth users fetched:", authUsers);
      
      // Create email map
      const emailMap = new Map();
      if (authUsers && !authError) {
        // Properly type the authUsers to access the users array
        type AuthUser = {
          id: string;
          email?: string;
        };
        
        // Use type assertion to tell TypeScript about the shape of the data
        const users = (authUsers as unknown as { users: AuthUser[] }).users || [];
        users.forEach(user => {
          if (user.id && user.email) {
            emailMap.set(user.id, user.email);
          }
        });
      } else {
        console.error('Error fetching auth users:', authError);
      }
      
      // Combine everything into the final result
      const result = userProfiles.map(profile => {
        let businessName = null;
        
        if (profile.client_id && clientMap.has(profile.client_id)) {
          businessName = clientMap.get(profile.client_id);
        }
        
        return {
          ...profile,
          email: emailMap.get(profile.id) || 'No email',
          business_name: businessName
        };
      });
      
      console.log("Final result:", result);
      return result as ClientAdmin[];
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
                <TableHead>Email</TableHead>
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
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      {admin.business_name || 'Not assigned'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
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
