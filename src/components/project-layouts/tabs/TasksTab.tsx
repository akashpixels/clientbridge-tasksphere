
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useLayout } from "@/context/layout";
import TasksTabContent from "../maintenance/TasksTabContent";
import TaskCommentThread from "../maintenance/comments/TaskCommentThread";
import ImageViewerDialog from "../maintenance/ImageViewerDialog";

interface TasksTabProps {
  projectId: string;
  selectedMonth?: string;
}

const TasksTab = ({ projectId, selectedMonth = format(new Date(), 'yyyy-MM') }: TasksTabProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTaskImages, setSelectedTaskImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const { setRightSidebarContent } = useLayout();

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
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

  const getTaskSortOrder = (task: any) => {
    const statusName = task.status?.name?.toLowerCase() || '';
    
    if (statusName.includes('progress') || statusName === 'open' || 
        statusName.includes('active') || statusName.includes('work')) {
      return 1; // Active tasks - highest priority
    }
    
    if (statusName.includes('queue') || task.queue_position) {
      return 2; // Scheduled/queue tasks - second priority
    }
    
    if (statusName.includes('complete') || statusName.includes('approved') || 
        statusName.includes('verified') || statusName.includes('done') || 
        task.completed_at) {
      return 3; // Completed tasks - third priority
    }
    
    return 4; // Special case tasks - lowest priority
  };

  const sortedTasks = processedTasks.sort((a, b) => {
    const aOrder = getTaskSortOrder(a);
    const bOrder = getTaskSortOrder(b);
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    if (aOrder === 1) {
      // For active tasks, sort by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    
    if (aOrder === 2) {
      // For scheduled tasks, sort by queue position
      const aPosition = a.queue_position || 999;
      const bPosition = b.queue_position || 999;
      return aPosition - bPosition;
    }
    
    if (aOrder === 3 && a.completed_at && b.completed_at) {
      // For completed tasks, sort by completion date (newest first)
      return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
    }
    
    // Default sort by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <>
      <TasksTabContent
        isLoadingTasks={isLoadingTasks}
        tasks={sortedTasks}
        sortConfig={{ key: 'default_sort', direction: 'asc' }}
        onSort={() => {}} // Empty function since we don't need sorting
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
