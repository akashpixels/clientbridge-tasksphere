
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useLayout } from "@/context/layout";
import TasksTabContent from "../components/TasksTabContent";
import TaskCommentThread from "../components/comments/TaskCommentThread";
import ImageViewerDialog from "../components/ImageViewerDialog";
import { toast } from "@/components/ui/use-toast";

interface TasksTabProps {
  projectId: string;
  selectedMonth?: string;
}

const TasksTab = ({ projectId, selectedMonth = format(new Date(), 'yyyy-MM') }: TasksTabProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTaskImages, setSelectedTaskImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const { setRightSidebarContent } = useLayout();
  const queryClient = useQueryClient();

  // Set up query key for tasks
  const tasksQueryKey = ['tasks', projectId, selectedMonth];

  // Helper function for determining task group order based on task_statuses.type and priority
  const getTaskSortOrder = (task: any) => {
    // Critical tasks (priority_level_id = 1) get the highest priority (0)
    if (task.priority_level_id === 1) {
      return 0; // Critical tasks
    }
    
    const statusType = task.status?.type?.toLowerCase() || '';
    
    if (statusType === 'active') {
      return 1; // Active tasks
    }
    
    if (statusType === 'scheduled') {
      return 2; // Scheduled tasks
    }
    
    if (statusType === 'completed') {
      return 3; // Completed tasks
    }
    
    return 4; // Other tasks
  };

  // Subscribe to real-time changes for the tasks table
  useEffect(() => {
    console.log('Setting up real-time subscription for tasks in project:', projectId);
    
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}` // Only listen for changes to tasks in this project
        },
        (payload) => {
          console.log('Task change detected:', payload);
          
          // Show toast notification for new tasks
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New task created",
              description: "A new task has been added to this project",
              duration: 3000
            });
          }
          
          // Invalidate the query to trigger a refetch
          queryClient.invalidateQueries({ queryKey: tasksQueryKey });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Clean up the subscription when the component unmounts
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient, tasksQueryKey]);

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: async () => {
      console.log('Fetching tasks for project:', projectId);
      const startDate = startOfMonth(new Date(selectedMonth));
      const endDate = endOfMonth(new Date(selectedMonth));
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_type:task_types(name, category),
          status:task_statuses!tasks_current_status_id_fkey(name, color_hex, type),
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
      
      console.log('Fetched tasks:', data);
      return data;
    },
    enabled: !!projectId && !!selectedMonth,
    refetchOnWindowFocus: false, // Disable automatic refetching on window focus
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Process the tasks data to ensure actual_duration and logged_duration are properly converted to numbers
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

  // Updated sorting logic based on task priority, task_statuses.type and secondary sorting criteria
  const sortedTasks = processedTasks.sort((a, b) => {
    // First, sort by status type order
    const aOrder = getTaskSortOrder(a);
    const bOrder = getTaskSortOrder(b);
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    // Secondary sorting within each group
    if (aOrder === 0) { // Critical tasks
      // Sort by est_start value
      if (a.est_start && b.est_start) {
        const dateComparison = new Date(a.est_start).getTime() - new Date(b.est_start).getTime();
        if (dateComparison !== 0) return dateComparison;
      } else if (a.est_start) {
        return -1; // a has est_start, b doesn't
      } else if (b.est_start) {
        return 1; // b has est_start, a doesn't
      }
      
      // If est_start is equal or not available, sort by priority level
      const aPriority = a.priority_level_id || 999;
      const bPriority = b.priority_level_id || 999;
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If priority is also equal, sort by creation date (oldest first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    
    if (aOrder === 1) { // Active tasks
      // Sort by est_start value
      if (a.est_start && b.est_start) {
        const dateComparison = new Date(a.est_start).getTime() - new Date(b.est_start).getTime();
        if (dateComparison !== 0) return dateComparison;
      } else if (a.est_start) {
        return -1; // a has est_start, b doesn't
      } else if (b.est_start) {
        return 1; // b has est_start, a doesn't
      }
      
      // If est_start is equal or not available, sort by priority level
      const aPriority = a.priority_level_id || 999;
      const bPriority = b.priority_level_id || 999;
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If priority is also equal, sort by creation date (oldest first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    
    if (aOrder === 2) { // Scheduled tasks
      // Sort by est_start value
      if (a.est_start && b.est_start) {
        const dateComparison = new Date(a.est_start).getTime() - new Date(b.est_start).getTime();
        if (dateComparison !== 0) return dateComparison;
      } else if (a.est_start) {
        return -1; // a has est_start, b doesn't
      } else if (b.est_start) {
        return 1; // b has est_start, a doesn't
      }
      
      // If est_start is equal or not available, sort by priority level
      const aPriority = a.priority_level_id || 999;
      const bPriority = b.priority_level_id || 999;
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If priority is also equal, sort by creation date (oldest first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    
    if (aOrder === 3) { // Completed tasks
      // Sort by est_end value (recently finished at the top)
      if (a.est_end && b.est_end) {
        return new Date(b.est_end).getTime() - new Date(a.est_end).getTime();
      } else if (a.est_end) {
        return -1;
      } else if (b.est_end) {
        return 1;
      }
      
      // If est_end is not available, fall back to completed_at
      if (a.completed_at && b.completed_at) {
        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
      }
    }
    
    // Default fallback: sort by creation date (oldest first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
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
