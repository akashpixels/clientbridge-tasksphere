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
  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState(2); // Default to 2 rows

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
        const {
          data,
          error
        } = await supabase.from('tasks').select(`
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
          `).eq('project_id', projectId).in('current_status_id', [1, 2, 3, 7]) // Active (Open, Paused, In Progress) and Queue status
        .order('current_status_id', {
          ascending: true
        }); // Active tasks first

        if (error) {
          throw error;
        }
        
        console.log("Fetched raw tasks:", data);
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

    const subscription = supabase.channel('tasks_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `project_id=eq.${projectId} AND current_status_id=in.(1,2,3,7)`
    }, (payload) => {
      console.log("Real-time task update received:", payload);
      fetchTasks();
    }).subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [projectId]);

  const getPriorityColor = (task: Task) => {
    if (!task.priority) return '#9CA3AF'; // Default gray
    return task.priority.color || '#9CA3AF';
  };

  const getStatusColor = (task: Task) => {
    if (!task.status) return '#9CA3AF'; // Default gray
    return task.status.color_hex || '#9CA3AF';
  };

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

  const activeTasks = tasks.filter(task => [1, 2, 3].includes(task.current_status_id));
  console.log("Active tasks:", activeTasks);
  
  const queuedTasks = tasks
    .filter(task => task.current_status_id === 7)
    .sort((a, b) => {
      if (a.priority_level_id !== b.priority_level_id) {
        return b.priority_level_id - a.priority_level_id;
      }
      
      if (a.queue_position !== null && b.queue_position !== null) {
        return a.queue_position - b.queue_position;
      }
      
      return (a.task_code || '').localeCompare(b.task_code || '');
    });
  
  console.log("Queued tasks after client-side sort:", queuedTasks.map(t => ({
    code: t.task_code,
    priority_id: t.priority_level_id,
    priority_name: t.priority?.name,
    queue_pos: t.queue_position
  })));

  const generateTaskRows = () => {
    const rows: Task[][] = Array.from({
      length: maxConcurrentTasks
    }, () => []);

    activeTasks.forEach((task, index) => {
      const rowIndex = index % maxConcurrentTasks;
      rows[rowIndex].push(task);
    });

    let currentRow = 0;
    let direction = 1;

    queuedTasks.forEach(task => {
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

  if (!isLoading && tasks.length === 0) {
    return null;
  }
  
  const taskRows = generateTaskRows();
  
  console.log("Task rows for rendering:", taskRows.map(row => 
    row.map(t => ({
      code: t.task_code, 
      status: t.current_status_id,
      priority_id: t.priority_level_id,
      priority: t.priority?.name
    }))
  ));
  
  return (
    <TooltipProvider>
      <div className="w-[300px] bg-background border border-border/40 rounded-lg shadow-sm">
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
                  {row.map(task => {
                    const isActive = [1, 2, 3].includes(task.current_status_id);
                    const colorToUse = isActive ? getStatusColor(task) : getPriorityColor(task);
                    const startTime = formatDateTime(task.start_time);
                    
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
                              {task.queue_position !== null && task.current_status_id === 7 && (
                                <span className="ml-1 text-[10px] bg-gray-100 px-1 rounded-sm">
                                  #{task.queue_position}
                                </span>
                              )}
                              {task.current_status_id === 7 && task.priority?.name && (
                                <span className="ml-1 text-[10px] bg-gray-100 px-1 rounded-full">
                                  {task.priority.name}
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
                                Queued (#{task.queue_position}) 
                                <span className="font-medium ml-1">
                                  {task.priority?.name}
                                </span>
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
