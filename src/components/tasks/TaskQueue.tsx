
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, Clock, ArrowUpDown } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TaskQueueProps {
  projectId: string;
}

interface Task {
  id: string;
  task_code: string;
  details: string;
  priority_level_id: number;
  current_status_id: number;
  priority: {
    name: string;
    color: string;
  } | null;
  status: {
    name: string;
    color_hex: string | null;
  } | null;
  start_time: string | null;
  eta: string | null;
}

export const TaskQueue = ({
  projectId
}: TaskQueueProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState(2); // Default to 2 rows
  const [isFixingQueue, setIsFixingQueue] = useState(false);
  const { toast } = useToast();

  // Modified function to manually fix queue positions
  const fixQueuePositions = async () => {
    setIsFixingQueue(true);
    try {
      // First get all queued tasks for this project
      const { data: queuedTasks, error: fetchError } = await supabase
        .from('tasks')
        .select('id, priority_level_id')
        .eq('project_id', projectId)
        .eq('current_status_id', 7) // Queued status
        .order('priority_level_id', { ascending: true }) // Lower number = higher priority
        .order('created_at', { ascending: true }); // First come, first served within same priority
      
      if (fetchError) throw fetchError;
      
      if (!queuedTasks || queuedTasks.length === 0) {
        toast({
          title: "No queue updates needed",
          description: "There are no tasks in the queue to reorder.",
        });
        return;
      }
      
      // Update tasks in order of priority
      const updatePromises = queuedTasks.map((task, index) => {
        return supabase
          .from('tasks')
          .update({ created_at: new Date(Date.now() + index * 1000).toISOString() })
          .eq('id', task.id);
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      toast({
        title: "Queue positions fixed",
        description: "Task queue order has been updated based on priority",
      });
      
      // Refresh tasks data
      fetchTasks();
    } catch (err: any) {
      console.error("Error fixing queue positions:", err);
      toast({
        title: "Error",
        description: "Failed to fix queue positions: " + err.message,
        variant: "destructive",
      });
    } finally {
      setIsFixingQueue(false);
    }
  };

  useEffect(() => {
    const fetchProjectConcurrency = async () => {
      try {
        const {
          data,
          error
        } = await supabase.from('projects').select('max_concurrent_tasks').eq('id', projectId).single();
        if (error) throw error;
        if (data && data.max_concurrent_tasks) {
          setMaxConcurrentTasks(data.max_concurrent_tasks);
        }
      } catch (err: any) {
        console.error("Error fetching project concurrency:", err);
      }
    };
    
    fetchProjectConcurrency();
    fetchTasks();

    // Set up real-time subscription for task changes
    const subscription = supabase.channel('tasks_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `project_id=eq.${projectId} AND current_status_id=in.(1,2,3,7)`
    }, () => {
      fetchTasks();
    }).subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [projectId]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // Fetch both active and queued tasks
      const {
        data,
        error
      } = await supabase.from('tasks').select(`
          id, 
          task_code, 
          details, 
          priority_level_id,
          current_status_id,
          start_time,
          eta,
          priority:priority_levels(name, color),
          status:task_statuses!tasks_current_status_id_fkey(name, color_hex)
        `).eq('project_id', projectId).in('current_status_id', [1, 2, 3, 7]) // Active (Open, Paused, In Progress) and Queue status
      .order('current_status_id', {
        ascending: true
      }) // Active tasks first
      .order('created_at', {
        ascending: true
      }); // Then by created_at

      if (error) {
        throw error;
      }
      setTasks(data || []);
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get priority color
  const getPriorityColor = (task: Task) => {
    if (!task.priority) return '#9CA3AF'; // Default gray
    return task.priority.color || '#9CA3AF';
  };

  // Helper function to get status color
  const getStatusColor = (task: Task) => {
    if (!task.status) return '#9CA3AF'; // Default gray
    return task.status.color_hex || '#9CA3AF';
  };

  // Helper function to format date for display
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return null;
      return format(date, "MMM d, h:mm a");
    } catch (e) {
      return null;
    }
  };

  // Split tasks into active (Open, Paused, In Progress) and queued
  const activeTasks = tasks.filter(task => [1, 2, 3].includes(task.current_status_id));
  const queuedTasks = tasks.filter(task => task.current_status_id === 7);

  // Check if there are potential queue issues
  const hasQueueIssues = () => {
    if (queuedTasks.length === 0) return false;
    
    // Check for priority inversions
    let lastPriority = 0;
    let hasPriorityInversion = false;
    
    queuedTasks.forEach((task, index) => {
      if (index === 0) {
        lastPriority = task.priority_level_id;
      } else {
        if (task.priority_level_id < lastPriority) {
          hasPriorityInversion = true;
        }
        lastPriority = task.priority_level_id;
      }
    });
    
    return hasPriorityInversion;
  };

  // Function to split tasks into rows based on max_concurrent_tasks
  const generateTaskRows = () => {
    const rows: Task[][] = Array.from({
      length: maxConcurrentTasks
    }, () => []);

    // First, distribute active tasks evenly at the start of each row
    activeTasks.forEach((task, index) => {
      const rowIndex = index % maxConcurrentTasks;
      rows[rowIndex].push(task);
    });

    // Then, add queued tasks in a snake pattern
    let currentRow = 0;
    let direction = 1; // 1 for forward, -1 for backward

    queuedTasks.forEach(task => {
      rows[currentRow].push(task);

      // Move to next row based on direction
      currentRow += direction;

      // Change direction if we hit the top or bottom row
      if (currentRow >= maxConcurrentTasks) {
        currentRow = maxConcurrentTasks - 1;
        direction = -1;
      } else if (currentRow < 0) {
        currentRow = 0;
        direction = 1;
      }
    });
    return rows;
  };

  // If there are no tasks, we don't show the component at all
  if (!isLoading && tasks.length === 0) {
    return null;
  }
  const taskRows = generateTaskRows();
  return (
    <TooltipProvider>
      <div className="w-full bg-background border border-border/40 rounded-lg shadow-sm">
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <h3 className="text-sm font-medium">Task Queue</h3>
          {hasQueueIssues() && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-7 px-2"
              onClick={fixQueuePositions}
              disabled={isFixingQueue}
            >
              {isFixingQueue ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <ArrowUpDown className="h-3 w-3 mr-1" />
              )}
              Fix Queue Order
            </Button>
          )}
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : error ? (
            <div className="flex items-center text-red-500 py-2">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {taskRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-wrap gap-1">
                  {row.map((task, index) => {
                    const isActive = [1, 2, 3].includes(task.current_status_id);
                    const colorToUse = isActive ? getStatusColor(task) : getPriorityColor(task);
                    const startTime = formatDateTime(task.start_time);
                    const queuePosition = isActive ? null : index + 1;
                    
                    return (
                      <Tooltip key={task.id}>
                        <TooltipTrigger asChild>
                          <div 
                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium cursor-help" 
                            style={{
                              backgroundColor: `${colorToUse}15`,
                              borderColor: colorToUse,
                              color: colorToUse
                            }}
                          >
                            <span className="flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full mr-1" style={{
                                backgroundColor: colorToUse
                              }} />
                              {task.task_code}
                              {!isActive && queuePosition !== null && (
                                <span className="ml-1 text-[10px] bg-gray-100 px-1 rounded-sm">
                                  #{queuePosition}
                                </span>
                              )}
                              {isActive && (
                                <span className="ml-1 text-[10px] bg-gray-100 px-1 rounded-full">
                                  {task.status?.name}
                                </span>
                              )}
                              {task.start_time && (
                                <Clock className="ml-1 h-2 w-2" />
                              )}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="p-2 max-w-[200px] text-xs">
                          <p className="font-medium mb-1">{task.details}</p>
                          {startTime && (
                            <p className="text-gray-500">Start: {startTime}</p>
                          )}
                          {formatDateTime(task.eta) && (
                            <p className="text-gray-500">ETA: {formatDateTime(task.eta)}</p>
                          )}
                          <p className="text-gray-500 mt-1">
                            {isActive ? task.status?.name : (
                              <>
                                Queued (#{queuePosition}) - 
                                {task.priority?.name || `Priority ${task.priority_level_id}`}
                              </>
                            )}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
