
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, updateTaskETAs, updateTaskStatuses } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useLayout } from "@/context/layout";
import TasksTabContent from "../maintenance/TasksTabContent";
import TaskCommentThread from "../maintenance/comments/TaskCommentThread";
import ImageViewerDialog from "../maintenance/ImageViewerDialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TasksTabProps {
  projectId: string;
  selectedMonth?: string;
}

const TasksTab = ({ projectId, selectedMonth = format(new Date(), 'yyyy-MM') }: TasksTabProps) => {
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' as 'asc' | 'desc' });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTaskImages, setSelectedTaskImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { setRightSidebarContent } = useLayout();
  const { toast } = useToast();

  const { data: tasks, isLoading: isLoadingTasks, refetch } = useQuery({
    queryKey: ['tasks', projectId, selectedMonth],
    queryFn: async () => {
      console.log('Fetching tasks for project:', projectId);
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
        .eq('project_id', projectId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!projectId && !!selectedMonth,
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
  
  const handleRefreshETAs = async () => {
    setIsRefreshing(true);
    
    try {
      // First update any tasks that should be in progress
      await updateTaskStatuses();
      
      // Then update the ETAs
      const result = await updateTaskETAs(projectId);
      
      toast({
        title: result.success ? "ETAs Updated" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      
      // Refresh the task list
      if (result.success) {
        await refetch();
      }
    } catch (error) {
      toast({
        title: "Error Refreshing ETAs",
        description: "An unexpected error occurred while updating ETAs.",
        variant: "destructive",
      });
      console.error("Error refreshing ETAs:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Process tasks data for display
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
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRefreshETAs} 
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? "Updating..." : "Refresh ETAs"}
        </Button>
      </div>
      
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
      
      <ImageViewerDialog
        selectedImage={selectedImage}
        selectedTaskImages={selectedTaskImages}
        currentImageIndex={currentImageIndex}
        onClose={() => setSelectedImage(null)}
        onPrevious={handlePreviousImage}
        onNext={handleNextImage}
      />
    </>
  );
};

export default TasksTab;
