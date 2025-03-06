
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Calendar, ArrowRight, AlertCircle, Hash, Flag } from "lucide-react";
import { format, parseISO, isValid, addHours } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface QueueTimelineProps {
  projectId: string;
}

interface Task {
  id: string;
  task_code: string;
  details: string;
  created_at: string;
  start_time: string | null;
  eta: string | null;
  current_status_id: number;
  priority_level_id: number;
  queue_position: number | null;
  priority: {
    name: string;
    color: string;
  } | null;
  status: {
    name: string;
    color_hex: string | null;
  } | null;
}

export function QueueTimeline({ projectId }: QueueTimelineProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to trigger start time recalculation for tasks with null start_time
  const updateTaskStartTimes = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('update-task-status');
      
      if (error) {
        console.error("Error invoking function:", error);
        toast({
          title: "Error",
          description: "Failed to update task start times: " + error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log("Updated task statuses:", data);
      toast({
        title: "Task start times updated",
        description: "Task timeline has been recalculated",
      });
      
      // Refresh task data
      fetchTasks();
    } catch (err: any) {
      console.error("Error updating task start times:", err);
      toast({
        title: "Error",
        description: "Failed to update task start times: " + err.message,
        variant: "destructive",
      });
    }
  };

  // Function to fix queue positions
  const fixQueuePositions = async () => {
    try {
      const { data, error } = await supabase.rpc('fix_existing_queues');
      
      if (error) {
        console.error("Error fixing queue positions:", error);
        toast({
          title: "Error",
          description: "Failed to fix queue positions: " + error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log("Fixed queue positions:", data);
      toast({
        title: "Queue positions fixed",
        description: "Task queue order has been updated based on priority",
      });
      
      // Refresh task data
      fetchTasks();
    } catch (err: any) {
      console.error("Error fixing queue positions:", err);
      toast({
        title: "Error",
        description: "Failed to fix queue positions: " + err.message,
        variant: "destructive",
      });
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
          created_at,
          start_time,
          eta,
          current_status_id,
          priority_level_id,
          queue_position,
          priority:priority_levels(name, color),
          status:task_statuses!tasks_current_status_id_fkey(name, color_hex)
        `)
        .eq('project_id', projectId)
        .in('current_status_id', [1, 2, 3, 7]) // Active and Queue status
        .order('start_time', { ascending: true });

      if (error) {
        throw error;
      }
      
      console.log('Timeline tasks:', data);
      setTasks(data || []);
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTasks();

    // Set up real-time subscription for task changes
    const subscription = supabase.channel('tasks_timeline_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId} AND current_status_id=in.(1,2,3,7)`
      }, () => {
        fetchTasks();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [projectId]);

  // Helper to format task times
  const formatTaskTime = (dateString: string | null): string => {
    if (!dateString) return 'Not scheduled';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Invalid date';
      return format(date, "MMM d, h:mm a");
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Calculate delay or early completion
  const calculateTimeStatus = (start: string | null, eta: string | null): {status: string; statusClass: string} => {
    if (!start || !eta) return { status: 'Not scheduled', statusClass: 'text-gray-500' };
    
    const startDate = parseISO(start);
    const etaDate = parseISO(eta);
    
    if (!isValid(startDate) || !isValid(etaDate)) {
      return { status: 'Invalid dates', statusClass: 'text-gray-500' };
    }
    
    const now = new Date();
    
    // Task hasn't started yet
    if (startDate > now) {
      return { status: 'Upcoming', statusClass: 'text-blue-500' };
    }
    
    // Task is in progress
    if (now < etaDate) {
      return { status: 'In Progress', statusClass: 'text-green-500' };
    }
    
    // Task is overdue
    return { status: 'Overdue', statusClass: 'text-amber-500' };
  };

  // Get color based on status
  const getStatusColor = (task: Task): string => {
    if (!task.status) return '#9CA3AF'; // Default gray
    return task.status.color_hex || '#9CA3AF';
  };

  // Get priority color
  const getPriorityColor = (task: Task): string => {
    if (!task.priority) return '#9CA3AF'; // Default gray
    return task.priority.color || '#9CA3AF';
  };

  // Check if there are tasks with missing start times
  const hasMissingStartTimes = tasks.some(task => 
    (task.current_status_id === 1 || task.current_status_id === 3) && !task.start_time
  );

  // Check for queue issues - now using our improved detection logic
  const hasQueueIssues = tasks.some(task => 
    task.current_status_id === 7 && (
      !task.queue_position || 
      task.queue_position <= 0 ||
      // Check if any task with higher priority (lower priority_level_id) 
      // has a higher queue position (which is wrong)
      tasks.some(otherTask => 
        otherTask.current_status_id === 7 &&
        otherTask.id !== task.id &&
        otherTask.priority_level_id < task.priority_level_id &&
        (otherTask.queue_position || 0) > (task.queue_position || 0)
      )
    )
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Queue Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Queue Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Queue Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No active or queued tasks found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Task Queue Timeline</CardTitle>
        <div className="flex gap-2">
          {hasMissingStartTimes && (
            <button 
              onClick={updateTaskStartTimes}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Update Start Times
            </button>
          )}
          {hasQueueIssues && (
            <button 
              onClick={fixQueuePositions}
              className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
            >
              Fix Queue Positions
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline track */}
          <div className="absolute left-0 top-8 bottom-0 w-[2px] bg-gray-200"></div>
          
          {/* Tasks along timeline */}
          <div className="space-y-8">
            {tasks.map((task, index) => {
              const timeStatus = calculateTimeStatus(task.start_time, task.eta);
              const statusColor = getStatusColor(task);
              const priorityColor = getPriorityColor(task);
              
              return (
                <div key={task.id} className="relative pl-6">
                  {/* Timeline node */}
                  <div 
                    className="absolute left-[-5px] top-1 w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: statusColor }}
                  ></div>
                  
                  {/* Task content */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{task.task_code}</span>
                        <Badge 
                          className="text-xs"
                          style={{
                            backgroundColor: `${statusColor}15`,
                            borderColor: statusColor,
                            color: statusColor
                          }}
                        >
                          {task.status?.name || 'Unknown'}
                        </Badge>
                        
                        {/* Queue Position Badge */}
                        {task.queue_position && (
                          <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            <Hash className="h-3 w-3 mr-1" />
                            <span>Queue: {task.queue_position}</span>
                          </div>
                        )}
                        
                        {/* Priority Level Badge */}
                        <div 
                          className="flex items-center text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${priorityColor}15`,
                            color: priorityColor
                          }}
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          <span>P{task.priority_level_id}: {task.priority?.name || 'Unknown'}</span>
                        </div>
                      </div>
                      <span className={`text-xs ${timeStatus.statusClass}`}>
                        {timeStatus.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600">{task.details}</p>
                    
                    <div className="flex items-center space-x-6 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Start: {formatTaskTime(task.start_time)}</span>
                      </div>
                      <div className="flex items-center">
                        <ArrowRight className="h-3 w-3 mr-1" />
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>ETA: {formatTaskTime(task.eta)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
