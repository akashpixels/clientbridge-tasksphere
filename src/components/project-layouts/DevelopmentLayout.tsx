
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import CredentialsTab from "./shared/CredentialsTab";
import { format } from "date-fns";

interface DevelopmentLayoutProps {
  project: Tables<"projects"> & {
    client_admin: {
      id: string;
      business_name: string;
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
      id: string;
      subscription_status: string;
      hours_spent: number | null;
      hours_allotted: number;
      start_date: string;
      next_renewal_date: string;
      max_concurrent_tasks: number;
      billing_cycle: string;
      auto_renew: boolean;
    }[];
  };
}

const DevelopmentLayout = ({ project }: DevelopmentLayoutProps) => {
  // Get the latest subscription
  const subscription = project.project_subscriptions?.[0];
  
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
              {project.client_admin?.user_profiles ? 
                `${project.client_admin.user_profiles.first_name} ${project.client_admin.user_profiles.last_name}` 
                : project.client_admin?.business_name || 'No Client'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Development Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1">{project.details || 'No details provided'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Status</h4>
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
                      <h4 className="text-sm font-medium text-gray-500">Progress</h4>
                      <p className="mt-1">{project.progress || 0}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {subscription && (
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Status</h4>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                          subscription.subscription_status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subscription.subscription_status}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Hours</h4>
                        <p className="mt-1">
                          {subscription.hours_spent || 0} / {subscription.hours_allotted} hours
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Start Date</h4>
                        <p className="mt-1">{format(new Date(subscription.start_date), 'MMM d, yyyy')}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Next Renewal</h4>
                        <p className="mt-1">{format(new Date(subscription.next_renewal_date), 'MMM d, yyyy')}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Billing Cycle</h4>
                        <p className="mt-1 capitalize">{subscription.billing_cycle}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Auto Renew</h4>
                        <p className="mt-1">{subscription.auto_renew ? 'Yes' : 'No'}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Max Concurrent Tasks</h4>
                        <p className="mt-1">{subscription.max_concurrent_tasks}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
          <CredentialsTab projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevelopmentLayout;
