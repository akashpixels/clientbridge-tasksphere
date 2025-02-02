import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";

interface DefaultLayoutProps {
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

const DefaultLayout = ({ project }: DefaultLayoutProps) => {
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
          <TabsTrigger value="team">Team</TabsTrigger>
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

        <TabsContent value="files">
          <Card className="p-6">
            <p>Files content coming soon...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DefaultLayout;