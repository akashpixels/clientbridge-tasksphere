
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useLayout } from "@/context/layout";
import BaseProjectLayout, { BaseProjectData, TabDefinition } from "@/components/projects/core/BaseProjectLayout";
import ProjectHeader from "@/components/projects/shared/ProjectHeader";
import ProjectStats from "@/components/projects/components/ProjectStats";
import TasksTabContent from "@/components/projects/components/TasksTabContent";
import TaskCommentThread from "@/components/projects/components/comments/TaskCommentThread";
import TeamTab from "@/components/projects/shared/TeamTab";
import CredentialsTab from "@/components/projects/shared/CredentialsTab"; 
import FilesTab from "@/components/projects/shared/FilesTab";
import ImageViewerDialog from "@/components/projects/components/ImageViewerDialog";
import { toast } from "@/components/ui/use-toast";

const RetainerLayout = (props: BaseProjectData) => {
  const { project, selectedMonth, onMonthChange, hoursUsageProgress } = props;
  const [sortConfig, setSortConfig] = useState({ key: 'default_sort', direction: 'asc' as 'asc' | 'desc' });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTaskImages, setSelectedTaskImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const { setRightSidebarContent, setCurrentTab } = useLayout();
  const queryClient = useQueryClient();

  const shouldFetchTasks = !!selectedMonth && !!project?.id;
  const tasksQueryKey = ['tasks', project?.id, selectedMonth];

  // Subscribe to real-time changes for the tasks table
  useEffect(() => {
    if (!project?.id) return;
    
    const channel = supabase
      .channel('retainer-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${project.id}` // Only listen for changes to tasks in this project
        },
        (payload) => {
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
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [project?.id, queryClient, tasksQueryKey]);

  const shouldFetchTasks = !!selectedMonth && !!project?.id;
  const tasksQueryKey = ['tasks', project?.id, selectedMonth];

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: async () => {
      const startDate = startOfMonth(new Date(selectedMonth || ''));
      const endDate = endOfMonth(new Date(selectedMonth || ''));
      
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
        .eq('project_id', project.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      return data;
    },
    enabled: shouldFetchTasks,
    refetchOnWindowFocus: false,
    staleTime: 30000, // Consider data stale after 30 seconds
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

  // Updated task sorting order based on task_statuses.type and priority
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

  // Updated sorting logic with correct type-based grouping and secondary sorting
  const sortedTasks = processedTasks.sort((a, b) => {
    if (sortConfig.key === 'default_sort') {
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
    } 
    else {
      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];
      
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    }
  });

  const headerContent = (
    <ProjectHeader
      project={project}
      selectedMonth={selectedMonth}
      onMonthChange={onMonthChange}
      statsComponent={<ProjectStats project={project} selectedMonth={selectedMonth || ''} />}
    />
  );

  const tabs: TabDefinition[] = [
    {
      id: "tasks",
      label: "Tasks",
      content: (
        <>
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
        </>
      ),
      default: true
    },
    {
      id: "overview",
      label: "Overview",
      content: (
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
      )
    },
    {
      id: "team",
      label: "Team",
      content: <TeamTab projectId={project.id} />
    },
    {
      id: "credentials",
      label: "Credentials",
      content: <CredentialsTab projectId={project.id} />
    },
    {
      id: "files",
      label: "Files",
      content: <FilesTab projectId={project.id} />
    }
  ];

  return (
    <>
      <BaseProjectLayout 
        {...props} 
        tabs={tabs} 
        headerContent={headerContent} 
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

export default RetainerLayout;
