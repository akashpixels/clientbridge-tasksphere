
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    },
  });

  const { data: agencyStaff, isLoading } = useQuery({
    queryKey: ['agency-staff'],
    enabled: currentUserRole === 1, // Only run for agency admins
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          first_name,
          last_name,
          username,
          job_role:job_roles(name)
        `)
        .eq('user_role_id', 2); // Only fetch agency staff (role_id = 2)
      
      if (error) {
        console.error('Error fetching agency staff:', error);
        return [];
      }
      
      console.log('Fetched agency staff:', data);
      return data;
    },
  });

  // Redirect or show access denied message if not an agency admin
  if (currentUserRole !== 1) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              You don't have permission to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Agency Staff</h1>
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">Loading agency staff...</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Job Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencyStaff && agencyStaff.length > 0 ? (
                    agencyStaff.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell>
                          {staff.first_name} {staff.last_name}
                        </TableCell>
                        <TableCell>{staff.username}</TableCell>
                        <TableCell>
                          {staff.job_role?.name || 'Not assigned'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        No agency staff found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;
