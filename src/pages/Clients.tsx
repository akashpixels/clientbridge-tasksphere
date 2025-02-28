
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const Clients = () => {
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_admins')
        .select(`
          *,
          user_profiles(
            first_name,
            last_name,
            username
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }
      
      return data;
    },
  });

  const { data: archivedClients, isLoading: isLoadingArchived } = useQuery({
    queryKey: ['archived-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_admins')
        .select(`
          *,
          user_profiles(
            first_name,
            last_name,
            username
          )
        `)
        .not('deleted_at', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching archived clients:', error);
        throw error;
      }
      
      return data;
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
                        <p className="text-sm text-gray-500">
                          {client.user_profiles?.first_name} {client.user_profiles?.last_name}
                        </p>
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
                        <p className="text-sm text-gray-500">
                          {client.user_profiles?.first_name} {client.user_profiles?.last_name}
                        </p>
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
