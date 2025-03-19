
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

// Update the type definition to match the actual structure from the database
type ClientAdmin = {
  id: string;
  business_name: string;
  logo_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  // Removed deleted_at as it no longer exists in the database
  primary_color_hex: string | null;  // Renamed from primary_color
  secondary_color_hex: string | null;  // Renamed from secondary_color
  user_profiles: {
    first_name: string;
    last_name: string;
    username: string;
  } | null;
};

const Clients = () => {
  const { data: clients, isLoading } = useQuery<ClientAdmin[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_admins')
        .select(`
          *,
          user_profiles:user_profiles(
            first_name,
            last_name,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }
      
      return data as ClientAdmin[];
    },
  });

  const { data: archivedClients, isLoading: isLoadingArchived } = useQuery<ClientAdmin[]>({
    queryKey: ['archived-clients'],
    queryFn: async () => {
      // Since we've removed the deleted_at column, we need to adjust this query
      // For this example, we're getting an empty array since we don't have a way to get archived clients anymore
      // You might need to add a new way to track archived clients in the future
      return [] as ClientAdmin[];
    },
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Clients</h1>
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Clients</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-8">Loading clients...</div>
            ) : clients?.length === 0 ? (
              <p>No active clients found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients?.map(client => (
                  <Card key={client.id} className="p-4">
                    <div className="flex items-center gap-3">
                      {client.logo_url && (
                        <img
                          src={client.logo_url}
                          alt={`${client.business_name} logo`}
                          className="w-12 h-12 object-contain rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-medium">{client.business_name}</h3>
                        {client.user_profiles && (
                          <p className="text-sm text-gray-500">
                            {client.user_profiles.first_name} {client.user_profiles.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="archived">
          <div className="grid gap-4">
            {isLoadingArchived ? (
              <div className="text-center py-8">Loading archived clients...</div>
            ) : archivedClients?.length === 0 ? (
              <p>No archived clients found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedClients?.map(client => (
                  <Card key={client.id} className="p-4 opacity-60">
                    <div className="flex items-center gap-3">
                      {client.logo_url && (
                        <img
                          src={client.logo_url}
                          alt={`${client.business_name} logo`}
                          className="w-12 h-12 object-contain rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-medium">{client.business_name}</h3>
                        {client.user_profiles && (
                          <p className="text-sm text-gray-500">
                            {client.user_profiles.first_name} {client.user_profiles.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Clients;
