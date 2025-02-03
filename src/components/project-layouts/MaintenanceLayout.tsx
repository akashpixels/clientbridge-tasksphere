import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { Monitor, Smartphone, ArrowUp, ArrowDown, Maximize, ArrowLeft, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

const MaintenanceLayout = ({ project }: DevelopmentLayoutProps) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTaskImages, setSelectedTaskImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  
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
          complexity:complexity_levels(name, multiplier),
          assigned_user:user_profiles!tasks_assigned_user_id_fkey(first_name, last_name)
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

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleImageClick = (image: string, images: string[]) => {
    setSelectedTaskImages(images);
    setSelectedImage(image);
    setCurrentImageIndex(images.indexOf(image));
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
      setSelectedImage(selectedTaskImages[currentImageIndex - 1]);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < selectedTaskImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      setSelectedImage(selectedTaskImages[currentImageIndex + 1]);
    }
  };

  const roundToNearestHalfHour = (hours: number) => {
    return Math.ceil(hours * 2) / 2;
  };

  const formatETA = (date: string) => {
    return format(new Date(date), "h.mmaaa do MMM");
  };

  const sortedTasks = tasks ? [...tasks].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof typeof a];
    const bValue = b[sortConfig.key as keyof typeof b];
    
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  }) : [];

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
              
              {isLoadingTasks ? (
                <p>Loading tasks...</p>
              ) : tasks && tasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => handleSort('status')}
                        >
                          Status {sortConfig.key === 'status' && (
                            sortConfig.direction === 'asc' ? <ArrowUp className="inline w-4 h-4" /> : <ArrowDown className="inline w-4 h-4" />
                          )}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => handleSort('details')}
                        >
                          Details
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => handleSort('priority_level_id')}
                        >
                          Priority
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => handleSort('complexity_level_id')}
                        >
                          Complexity
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => handleSort('eta')}
                        >
                          ETA
                        </TableHead>
                        <TableHead>Assets</TableHead>
                        <TableHead>Device</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <span 
                                className="px-2 py-1 text-xs rounded-full block w-fit"
                                style={{
                                  backgroundColor: `${task.status?.color_hex}15`,
                                  color: task.status?.color_hex
                                }}
                              >
                                {task.status?.name}
                              </span>
                              {task.task_completed_at && task.hours_spent && (
                                <span className="text-xs text-gray-500 text-center block">
                                  {roundToNearestHalfHour(task.hours_spent)} hrs
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{task.task_type?.name}</p>
                              <p className="text-sm text-gray-500">{task.details}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs" style={{ color: task.priority?.color }}>
                              {task.priority?.name}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600">
                              {task.complexity?.name}
                            </span>
                          </TableCell>
                          <TableCell>
                            {task.eta ? formatETA(task.eta) : 'Not set'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {task.images && Array.isArray(task.images) && task.images.length > 0 && (
                                <div className="flex -space-x-2">
                                  {task.images.map((image, index) => (
                                    <div
                                      key={index}
                                      className="w-8 h-8 relative cursor-pointer"
                                      onClick={() => handleImageClick(image as string, task.images as string[])}
                                    >
                                      <img 
                                        src={image as string}
                                        alt={`Task image ${index + 1}`}
                                        className="w-8 h-8 rounded-lg border-2 border-white object-cover"
                                      />
                                      <Maximize className="w-3 h-3 absolute top-0 right-0 text-gray-600 bg-white rounded-full p-0.5" />
                                    </div>
                                  ))}
                                </div>
                              )}
                              {task.reference_links && Array.isArray(task.reference_links) && task.reference_links.length > 0 && (
                                <div className="flex items-center">
                                  <span className="text-xs text-blue-600">
                                    {task.reference_links.length} link{task.reference_links.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p>No tasks found for this project.</p>
              )}
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

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <div className="relative flex-1 min-h-0">
            {selectedImage && (
              <div className="flex items-center justify-center h-full">
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 p-2 bg-white/80 rounded-full"
                  disabled={currentImageIndex === 0}
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <img 
                  src={selectedImage} 
                  alt="Task image"
                  className="max-w-full max-h-[70vh] object-contain"
                />
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 p-2 bg-white/80 rounded-full"
                  disabled={currentImageIndex === selectedTaskImages.length - 1}
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceLayout;
