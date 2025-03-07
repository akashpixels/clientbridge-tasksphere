
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowDownUp, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskQueueManagerProps {
  projectId: string;
}

interface QueuedTask {
  id: string;
  task_code: string;
  details: string;
  queue_position: number | null;
  priority_level_id: number;
  priority: {
    name: string;
    color: string;
  } | null;
  created_at: string;
}

export function TaskQueueManager({ projectId }: TaskQueueManagerProps) {
  const [queuedTasks, setQueuedTasks] = useState<QueuedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [queueIssues, setQueueIssues] = useState<string[]>([]);
  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState(1);
  const { toast } = useToast();

  // Fetch current queue state
  useEffect(() => {
    const fetchQueueData = async () => {
      setIsLoading(true);
      try {
        // Get max concurrent tasks from project or subscription
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('max_concurrent_tasks')
          .eq('id', projectId)
          .single();
        
        if (projectError) throw projectError;
        
        if (projectData) {
          setMaxConcurrentTasks(projectData.max_concurrent_tasks);
        }
        
        // Get all queued tasks
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            id, task_code, details, queue_position, priority_level_id, created_at,
            priority:priority_levels(name, color)
          `)
          .eq('project_id', projectId)
          .eq('current_status_id', 7) // Queued status
          .order('queue_position', { ascending: true });
        
        if (tasksError) throw tasksError;
        
        setQueuedTasks(tasks || []);
        
        // Check for queue issues
        const issues = validateQueueIntegrity(tasks || []);
        setQueueIssues(issues);
      } catch (err: any) {
        console.error("Error fetching queue data:", err);
        toast({
          title: "Error",
          description: "Failed to load queue data: " + err.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQueueData();
    
    // Set up real-time subscription for queue changes
    const subscription = supabase
      .channel('queue_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId} AND current_status_id=eq.7`
      }, () => {
        fetchQueueData();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [projectId, toast]);

  // Function to validate queue integrity
  const validateQueueIntegrity = (tasks: QueuedTask[]): string[] => {
    const issues: string[] = [];
    
    // Check for missing or duplicate queue positions
    const positionMap = new Map<number, string>();
    const missingPositions: QueuedTask[] = [];
    
    tasks.forEach(task => {
      if (task.queue_position === null) {
        missingPositions.push(task);
      } else if (positionMap.has(task.queue_position)) {
        issues.push(`Duplicate queue position ${task.queue_position} for tasks ${positionMap.get(task.queue_position)} and ${task.task_code}`);
      } else {
        positionMap.set(task.queue_position, task.task_code);
      }
    });
    
    if (missingPositions.length > 0) {
      issues.push(`${missingPositions.length} tasks missing queue positions: ${missingPositions.map(t => t.task_code).join(', ')}`);
    }
    
    // Check for priority inversions
    for (let i = 0; i < tasks.length - 1; i++) {
      const currentTask = tasks[i];
      const nextTask = tasks[i + 1];
      
      if (currentTask.queue_position !== null && nextTask.queue_position !== null && 
          currentTask.priority_level_id > nextTask.priority_level_id) {
        issues.push(`Priority inversion: ${currentTask.task_code} (P${currentTask.priority_level_id}) is before ${nextTask.task_code} (P${nextTask.priority_level_id})`);
      }
    }
    
    // Check for gaps in queue positions
    if (tasks.length > 0) {
      const positions = tasks
        .map(t => t.queue_position)
        .filter((pos): pos is number => pos !== null)
        .sort((a, b) => a - b);
      
      if (positions.length > 0) {
        const minPos = positions[0];
        const maxPos = positions[positions.length - 1];
        
        if (minPos > 1) {
          issues.push(`Queue doesn't start at position 1 (starts at ${minPos})`);
        }
        
        if (maxPos !== positions.length) {
          issues.push(`Gaps detected in queue positions`);
        }
      }
    }
    
    return issues;
  };

  // Fix queue positions by priority
  const fixQueuePositions = async () => {
    setIsUpdating(true);
    try {
      if (!queuedTasks || queuedTasks.length === 0) {
        toast({
          title: "No queue updates needed",
          description: "There are no tasks in the queue to reorder.",
        });
        return;
      }
      
      // Sort tasks by priority and creation date
      const sortedTasks = [...queuedTasks].sort((a, b) => {
        // First by priority (lower priority_level_id = higher priority)
        if (a.priority_level_id !== b.priority_level_id) {
          return a.priority_level_id - b.priority_level_id;
        }
        // Then by creation date (older first)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      // Update queue positions
      const updatePromises = sortedTasks.map((task, index) => {
        return supabase
          .from('tasks')
          .update({ queue_position: index + 1 })
          .eq('id', task.id);
      });
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Queue positions fixed",
        description: "Task queue order has been updated based on priority",
      });
    } catch (err: any) {
      console.error("Error fixing queue positions:", err);
      toast({
        title: "Error",
        description: "Failed to fix queue positions: " + err.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Generate queue lanes based on max_concurrent_tasks
  const generateQueueLanes = () => {
    const lanes: QueuedTask[][] = Array.from({ length: maxConcurrentTasks }, () => []);
    
    queuedTasks.forEach((task, index) => {
      const laneIndex = index % maxConcurrentTasks;
      lanes[laneIndex].push(task);
    });
    
    return lanes;
  };

  // Render a task pill
  const renderTaskPill = (task: QueuedTask) => {
    const colorToUse = task.priority?.color || '#9CA3AF';
    
    return (
      <TooltipProvider key={task.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium cursor-help shadow-sm my-1"
              style={{
                backgroundColor: `${colorToUse}15`,
                borderColor: colorToUse,
                color: colorToUse
              }}
            >
              <span className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: colorToUse }} />
                {task.task_code}
                {task.queue_position && (
                  <span className="ml-1 text-[10px] bg-gray-100 px-1 rounded-sm">
                    #{task.queue_position}
                  </span>
                )}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="p-2 max-w-[200px] text-xs">
            <p className="font-medium mb-1">{task.details}</p>
            <p className="text-gray-500 mt-1">
              Priority: {task.priority?.name || `P${task.priority_level_id}`}
            </p>
            <p className="text-gray-500">
              Created: {format(new Date(task.created_at), "MMM d, h:mm a")}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading Queue Management...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const queueLanes = generateQueueLanes();

  return (
    <Card>
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Queue Management</CardTitle>
        {queueIssues.length > 0 && (
          <Button
            size="sm" 
            variant="outline" 
            className="text-xs h-7 px-2"
            onClick={fixQueuePositions}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <ArrowDownUp className="h-3 w-3 mr-1" />
            )}
            Fix Queue Order
          </Button>
        )}
      </CardHeader>
      <CardContent className="py-3">
        {queuedTasks.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-4">
            <Info className="h-4 w-4 mx-auto mb-2" />
            No tasks in queue
          </div>
        ) : (
          <>
            {queueIssues.length > 0 && (
              <div className="mb-3 bg-amber-50 border border-amber-200 rounded-md p-2 text-amber-800 text-xs">
                <div className="flex items-start">
                  <AlertTriangle className="h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Queue integrity issues detected:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {queueIssues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Total tasks in queue: {queuedTasks.length}</span>
                <span>Max concurrent tasks: {maxConcurrentTasks}</span>
              </div>
              
              <div className="flex flex-col space-y-2">
                {queueLanes.map((lane, laneIndex) => (
                  <div key={laneIndex} className="border border-dashed border-gray-200 rounded-md p-2">
                    <div className="text-xs text-gray-500 mb-1">Lane {laneIndex + 1}</div>
                    <div className="flex flex-wrap gap-1">
                      {lane.map(task => renderTaskPill(task))}
                      {lane.length === 0 && (
                        <div className="text-xs text-gray-400 italic">Empty lane</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
