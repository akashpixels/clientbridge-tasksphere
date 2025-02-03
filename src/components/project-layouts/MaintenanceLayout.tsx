import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { Monitor, Smartphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  };
}

const MaintenanceLayout = ({ project }: DevelopmentLayoutProps) => {
  // Calculate hours percentage
  const hoursPercentage = Math.min(Math.round((project.hours_spent / project.hours_allotted) * 100), 100);

  // Fetch tasks for this project
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks', project.id],
    queryFn: async () => {
      console.log('Fetching tasks for project:', project.id);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_type:task_types(name, category),
          status:task_statuses!tasks_current_status_id_fkey(name, color_hex),
          priority:priority_levels(name, color),
          assigned_user:user_profiles(first_name, last_name)
        `)
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      console.log('Fetched tasks:', data);
      return data;
    },
  });

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
          
          <div className="flex gap-6">
            {/* Subscription Status Card */}
            <div className="bg-white rounded-[6px] p-4 border border-gray-100 min-w-[280px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Subscription</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  project.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.subscription_status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Renews on 1st April</p>
                <p className="text-xs font-medium text-gray-600">Billing Cycle: Monthly</p>
              </div>
            </div>

            {/* Hours Progress Card */}
            <div className="bg-white rounded-[6px] p-4 border border-gray-100 min-w-[280px]">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Hours Used</span>
                  <span className="text-sm font-semibold">{hoursPercentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      hoursPercentage > 90 ? 'bg-red-500' :
                      hoursPercentage > 70 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${hoursPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {project.hours_spent} / {project.hours_allotted} hrs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Project Tasks</h3>
                <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">
                  New Task
                </button>
              </div>
              
              <div className="space-y-2">
                {isLoadingTasks ? (
                  <p>Loading tasks...</p>
                ) : tasks && tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div key={task.id} className="p-4 border border-gray-100 rounded-md">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{task.task_type?.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {task.details}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span 
                              className="px-2 py-1 text-xs rounded-full"
                              style={{
                                backgroundColor: `${task.status?.color_hex}15`,
                                color: task.status?.color_hex
                              }}
                            >
                              {task.status?.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {task.priority?.name} Priority
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>ETA: {task.eta ? new Date(task.eta).toLocaleDateString() : 'Not set'}</span>
                            <span>Hours: {task.hours_spent || 0}/{task.hours_needed || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {task.target_device === 'Desktop' && <Monitor className="w-4 h-4" />}
                            {task.target_device === 'Mobile' && <Smartphone className="w-4 h-4" />}
                            {task.target_device === 'Both' && (
                              <>
                                <Monitor className="w-4 h-4" />
                                <Smartphone className="w-4 h-4" />
                              </>
                            )}
                          </div>
                        </div>
                        {task.images && Array.isArray(task.images) && task.images.length > 0 && (
                          <div className="flex gap-2">
                            {task.images.map((image, index) => (
                              <div key={index} className="w-12 h-12 bg-gray-100 rounded">
                                <img src={image as string} alt={`Task image ${index + 1}`} className="w-full h-full object-cover rounded" />
                              </div>
                            ))}
                          </div>
                        )}
                        {task.reference_links && Array.isArray(task.reference_links) && task.reference_links.length > 0 && (
                          <div className="flex gap-2">
                            {task.reference_links.map((link, index) => {
                              const linkStr = typeof link === 'string' ? link : String(link);
                              return (
                                <a 
                                  key={index}
                                  href={linkStr}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  {linkStr}
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No tasks found for this project.</p>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

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
