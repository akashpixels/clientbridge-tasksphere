
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

// Define the type for client data
interface ClientAdmin {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  client_id: string;
  business_name: string;
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
      console.log("Fetching client data...");
      
      // First, get all clients directly from the clients table
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id, business_name');
      
      if (clientError) {
        console.error('Error fetching clients:', clientError);
        return [];
      }
      
      console.log("Clients fetched:", clients);
      
      // Create an array to store the final results
      const results: ClientAdmin[] = [];
      
      // For each client, find the associated client admin user
      for (const client of clients) {
        // Get the client admin user (user_role_id = 3) associated with this client
        const { data: userProfiles, error: userError } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, username')
          .eq('user_role_id', 3)
          .eq('id', client.id); // Assuming id in user_profiles references client.id
        
        if (userError) {
          console.error(`Error fetching user profile for client ${client.id}:`, userError);
          continue;
        }
        
        console.log(`User profiles for client ${client.id}:`, userProfiles);
        
        // If we found matching user profiles
        if (userProfiles && userProfiles.length > 0) {
          // For each user profile, get the email from auth.users
          for (const profile of userProfiles) {
            // Get email from auth.users using the profile id
            const { data: authUser, error: authError } = await supabase.auth
              .admin.getUserById(profile.id);
            
            if (authError) {
              console.error(`Error fetching auth user for profile ${profile.id}:`, authError);
              continue;
            }
            
            const email = authUser?.user?.email || 'No email';
            
            // Add to results
            results.push({
              ...profile,
              email,
              client_id: client.id,
              business_name: client.business_name,
            });
          }
        }
      }
      
      console.log("Final client admins data:", results);
      return results;
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
                    <TableCell>{admin.business_name}</TableCell>
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
