import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, Clock } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskQueueProps {
  projectId: string;
}

interface Task {
  id: string;
  task_code: string;
  details: string;
  queue_position: number | null;
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
  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState(2);

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
    
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            id, 
            task_code, 
            details, 
            queue_position, 
            priority_level_id,
            current_status_id,
            start_time,
            eta,
            priority:priority_levels(name, color),
            status:task_statuses!tasks_current_status_id_fkey(name, color_hex)
          `)
          .eq('project_id', projectId)
          .eq('current_status_id', 7) // Queue status
          .order('queue_position', { ascending: true });

        if (error) {
          throw error;
        }

        // Log the queue order for debugging
        console.log('Current queue order:', data?.map(t => ({
          code: t.task_code,
          priority: t.priority?.name,
          position: t.queue_position
        })));

        setTasks(data || []);
      } catch (err: any) {
        console.error("Error fetching tasks:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectConcurrency();
    fetchTasks();

    // Set up real-time subscription for task changes
    const subscription = supabase
      .channel('tasks-queue-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId} AND current_status_id=eq.7`
      }, () => {
        console.log('Queue change detected, refreshing...');
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [projectId]);

  // Helper function to get priority color
  const getPriorityColor = (task: Task) => {
    if (!task.priority) return '#9CA3AF';
    return task.priority.color || '#9CA3AF';
  };

  // Split tasks into rows based on max_concurrent_tasks
  const generateTaskRows = () => {
    const rows: Task[][] = Array.from({ length: maxConcurrentTasks }, () => []);
    let currentRow = 0;
    let direction = 1;

    tasks.forEach(task => {
      rows[currentRow].push(task);
      currentRow += direction;

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
        <p className="text-sm">Loading queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center text-red-500 p-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const taskRows = generateTaskRows();

  return (
    <TooltipProvider>
      <div className="w-full bg-background border border-border/40 rounded-lg shadow-sm">
        <div className="p-4">
          <h3 className="text-sm font-medium mb-3">Task Queue</h3>
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks in queue</p>
          ) : (
            <div className="space-y-2">
              {taskRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-wrap gap-2">
                  {row.map(task => {
                    const priorityColor = getPriorityColor(task);
                    return (
                      <Tooltip key={task.id}>
                        <TooltipTrigger asChild>
                          <div 
                            className="inline-flex items-center rounded-full border px-3 py-1 text-sm cursor-help transition-colors"
                            style={{
                              backgroundColor: `${priorityColor}15`,
                              borderColor: priorityColor,
                              color: priorityColor
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColor }} />
                              {task.task_code}
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded-full">
                                #{task.queue_position}
                              </span>
                              <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                                {task.priority?.name}
                              </span>
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="p-2 max-w-xs">
                          <p className="font-medium mb-1">{task.details}</p>
                          <p className="text-xs text-gray-500">Priority: {task.priority?.name}</p>
                          <p className="text-xs text-gray-500">Queue Position: {task.queue_position}</p>
                          {task.eta && (
                            <p className="text-xs text-gray-500 mt-1">
                              ETA: {format(parseISO(task.eta), "MMM d, h:mm a")}
                            </p>
                          )}
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
