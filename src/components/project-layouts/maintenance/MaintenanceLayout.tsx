import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import ProjectHeader from "./ProjectHeader";
import TasksTabContent from "./TasksTabContent";
import ImageViewerDialog from "./ImageViewerDialog";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useLayout } from "@/context/layout";
import TaskCommentThread from "./comments/TaskCommentThread";
import CredentialsTab from "../shared/CredentialsTab";
import FilesTab from "../shared/FilesTab";
import TeamTab from "../shared/TeamTab";

interface MaintenanceLayoutProps {
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
    project_subscriptions?: {
      id: string;
      subscription_status: string;
      allocated_duration: unknown;
      actual_duration: unknown;
      next_renewal_date: string;
    }[];
  };
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  hoursUsageProgress?: React.ReactNode;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

const MaintenanceLayout = ({ project, selectedMonth, onMonthChange }: MaintenanceLayoutProps) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTaskImages, setSelectedTaskImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const { setRightSidebarContent, closeRightSidebar, setCurrentTab } = useLayout();

  useEffect(() => {
    console.log("MaintenanceLayout - Project ID:", project.id);
    
    const checkProjectData = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('id', project.id)
          .single();
          
        console.log("Direct project access test:", data);
        console.log("Direct project access error:", error);
      } catch (e) {
        console.error("Error checking project data:", e);
      }
    };
    
    checkProjectData();
  }, [project.id]);

  const { data: tasks, isLoading: isLoadingTasks, error: tasksError } = useQuery({
    queryKey: ['tasks', project.id, selectedMonth],
    queryFn: async () => {
      console.log('Fetching tasks for project:', project.id);
      const startDate = startOfMonth(new Date(selectedMonth));
      const endDate = endOfMonth(new Date(selectedMonth));
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_type:task_types(name, category),
          status:task_statuses!tasks_current_status_id_fkey(name, color_hex),
          priority:priority_levels(name, color_hex),
          complexity:complexity_levels(name, multiplier),
          assigned_user:user_profiles!tasks_assigned_user_id_fkey(first_name, last_name)
        `)
        .eq('project_id', project.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      console.log('Fetched tasks:', data);
      return data;
    },
  });

  useEffect(() => {
    if (tasksError) {
      console.error("Task query error:", tasksError);
    }
  }, [tasksError]);

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

  const processedTasks = tasks ? tasks.map(task => ({
    ...task,
    actual_duration: typeof task.actual_duration === 'object' && task.actual_duration !== null
      ? parseFloat(String(task.actual_duration)) || 0
      : (typeof task.actual_duration === 'string'
          ? parseFloat(task.actual_duration) || 0
          : (typeof task.actual_duration === 'number' 
              ? task.actual_duration
              : null)),
    logged_duration: typeof task.logged_duration === 'object' && task.logged_duration !== null
      ? parseFloat(String(task.logged_duration)) || 0
      : (typeof task.logged_duration === 'string'
          ? parseFloat(task.logged_duration) || 0
          : (typeof task.logged_duration === 'number' 
              ? task.logged_duration
              : null))
  })) : [];

  const sortedTasks = processedTasks.sort((a, b) => {
    const aValue = a[sortConfig.key as keyof typeof a];
    const bValue = b[sortConfig.key as keyof typeof b];
    
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <ProjectHeader 
          project={project} 
          selectedMonth={selectedMonth}
          onMonthChange={onMonthChange}
        />
      </div>

      <Tabs defaultValue="tasks" className="w-full" onValueChange={(value) => setCurrentTab(value)}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tasks">
          <TasksTabContent
            isLoadingTasks={isLoadingTasks}
            tasks={sortedTasks}
            sortConfig={sortConfig}
            onSort={handleSort}
            onImageClick={handleImageClick}
            onCommentClick={(taskId: string) => {
              setRightSidebarContent(
                <TaskCommentThread taskId={taskId} />
              );
            }}
          />
        </TabsContent>

        <TabsContent value="overview">
          <div className="space-y-6">
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
          </div>
        </TabsContent>

        <TabsContent value="team">
          <TeamTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="credentials">
          <CredentialsTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="files">
          <FilesTab projectId={project.id} />
        </TabsContent>
      </Tabs>

      <ImageViewerDialog
        selectedImage={selectedImage}
        selectedTaskImages={selectedTaskImages}
        currentImageIndex={currentImageIndex}
        onClose={() => setSelectedImage(null)}
        onPrevious={handlePreviousImage}
        onNext={handleNextImage}
      />
    </div>
  );
};

export default MaintenanceLayout;
