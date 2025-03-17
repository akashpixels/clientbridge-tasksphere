
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import CredentialsTab from "./shared/CredentialsTab";
import { intervalToHours } from "@/lib/date-utils";

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
      hours_spent: number | unknown;
      hours_allotted: number | unknown;
    }[];
  };
}

const DevelopmentLayout = ({ project }: DevelopmentLayoutProps) => {
  // Get the latest subscription
  const currentSubscription = project.project_subscriptions?.[0];
  
  // Convert interval to hours if needed
  const hoursSpent = currentSubscription ? intervalToHours(currentSubscription.hours_spent) : 0;
  const hoursAllotted = currentSubscription ? intervalToHours(currentSubscription.hours_allotted) : 0;
  
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
                    {`${hoursSpent.toFixed(1)} / ${hoursAllotted} hours`}
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
          <CredentialsTab projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevelopmentLayout;
