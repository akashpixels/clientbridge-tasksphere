import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";

interface MaintenanceLayoutProps {
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
  };
}

const MaintenanceLayout = ({ project }: MaintenanceLayoutProps) => {
  // Calculate renewal date (example: 10 days from now)
  const renewalDate = new Date();
  renewalDate.setDate(renewalDate.getDate() + 10);
  const daysUntilRenewal = Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // Calculate hours percentage
  const hoursPercentage = Math.min(Math.round((project.hours_spent / project.hours_allotted) * 100), 100);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-start justify-between">
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
          
          <div className="flex gap-8">
            {/* Subscription Status Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Subscription</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  project.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.subscription_status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-gray-500">Renews in {daysUntilRenewal} days</p>
            </div>

            {/* Payment Status Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Payment</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  project.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                  project.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {project.payment_status.charAt(0).toUpperCase() + project.payment_status.slice(1)}
                </span>
              </div>
              <p className="text-xs text-gray-500">Next payment: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Hours Progress Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all min-w-[200px]">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Hours Used</span>
                  <span className="text-sm font-semibold">{hoursPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      hoursPercentage > 90 ? 'bg-red-500' :
                      hoursPercentage > 70 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${hoursPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {project.hours_spent} / {project.hours_allotted} hrs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Project Details</h3>
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
                  <h4 className="font-medium">Progress</h4>
                  <p className="text-gray-500 mt-1">{project.progress || 0}%</p>
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

        <TabsContent value="team">
          <Card className="p-6">
            <p>Team content coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="credentials">
          <Card className="p-6">
            <p>Credentials content coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card className="p-6">
            <p>Files content coming soon...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaintenanceLayout;