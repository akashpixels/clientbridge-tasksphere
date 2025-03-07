
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import CredentialsTab from "./shared/CredentialsTab";
import TeamTab from "./shared/TeamTab";
import { NewTaskButton } from "./maintenance/NewTaskButton";
import { TaskQueue } from "@/components/tasks/TaskQueue";
import { TaskQueueManager } from "@/components/tasks/TaskQueueManager";

interface DefaultLayoutProps {
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
              {project.client_admin?.user_profiles ? 
                `${project.client_admin.user_profiles.first_name} ${project.client_admin.user_profiles.last_name}` 
                : project.client_admin?.business_name || 'No Client'}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
          <NewTaskButton />
        </div>

        <TabsContent value="overview">
          <div className="space-y-4">
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
            
            {/* Task Queue Manager Component */}
            <TaskQueueManager projectId={project.id} />
            
            {/* Task Queue Component */}
            <TaskQueue projectId={project.id} />
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="p-6">
            <p>Tasks content coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <TeamTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="credentials">
          <CredentialsTab projectId={project.id} />
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
