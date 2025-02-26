
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";

interface DevelopmentLayoutProps {
  project: Tables<"projects"> & {
    client: {
      id: string;
      user_profiles: {
        first_name: string;
        last_name: string;
      } | null;
    } | null;
    status: {
      name: string;
      color_hex: string | null;
    } | null;
    project_subscriptions: {
      hours_spent: number | null;
      hours_allotted: number;
    }[];
  };
}

const DevelopmentLayout = ({ project }: DevelopmentLayoutProps) => {
  // Get the latest subscription
  const currentSubscription = project.project_subscriptions?.[0];

  // Fetch credentials for the project
  const { data: credentials, isLoading: isLoadingCredentials } = useQuery({
    queryKey: ['credentials', project.id],
    queryFn: async () => {
      console.log('Fetching credentials for project:', project.id);
      const { data, error } = await supabase
        .from('project_credentials')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching credentials:', error);
        throw error;
      }

      console.log('Fetched credentials:', data);
      return data;
    },
  });
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          {project.logo_url && (
            <img 
              src={project.logo_url} 
              alt={`${project.name} logo`}
              className="w-16 h-16 object-contain rounded-lg"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <p className="text-gray-500">
              {project.client?.user_profiles ? 
                `${project.client.user_profiles.first_name} ${project.client.user_profiles.last_name}` 
                : 'No Client'}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="api-docs">API Docs</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Development Overview</h3>
                <p className="text-gray-500 mt-1">{project.details || 'No details provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Status</h4>
                  <span 
                    className="inline-block px-2 py-1 rounded-full text-xs mt-1"
                    style={{
                      backgroundColor: `${project.status?.color_hex}15`,
                      color: project.status?.color_hex
                    }}
                  >
                    {project.status?.name || 'Unknown'}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-medium">Hours</h4>
                  <p className="text-gray-500 mt-1">
                    {currentSubscription ? 
                      `${currentSubscription.hours_spent || 0} / ${currentSubscription.hours_allotted} hours` 
                      : 'No subscription data'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="p-6">
            <p>Tasks content coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="api-docs">
          <Card className="p-6">
            <p>API documentation coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="deployments">
          <Card className="p-6">
            <p>Deployment history coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="p-6">
            <p>Team content coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="credentials">
          <Card className="p-6">
            {isLoadingCredentials ? (
              <div>Loading credentials...</div>
            ) : credentials && credentials.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Project Credentials</h3>
                  <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">
                    Add Credentials
                  </button>
                </div>
                <div className="grid gap-4">
                  {credentials.map((cred) => (
                    <div 
                      key={cred.id} 
                      className="p-4 border rounded-lg bg-card"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{cred.type}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {cred.details || 'No additional details'}
                          </p>
                        </div>
                        <button className="text-sm text-blue-500 hover:text-blue-600">
                          View Details
                        </button>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">URL:</span>
                          <a 
                            href={cred.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:text-blue-600"
                          >
                            {cred.url}
                          </a>
                        </div>
                        {cred.username && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Username:</span>
                            <span className="text-sm">{cred.username}</span>
                          </div>
                        )}
                        {cred.encrypted && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              🔒 Encrypted
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No credentials found for this project.</p>
                <button className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">
                  Add First Credentials
                </button>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevelopmentLayout;
