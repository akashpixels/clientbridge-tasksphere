
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";

interface TaskQueueProps {
  projectId: string;
}

interface QueuedTask {
  id: string;
  task_code: string;
  details: string;
  queue_position: number;
  priority_level_id: number;
  priority: {
    name: string;
    color: string;
  } | null;
}

export const TaskQueue = ({ projectId }: TaskQueueProps) => {
  const [queuedTasks, setQueuedTasks] = useState<QueuedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueuedTasks = async () => {
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
            priority:priority_levels(name, color)
          `)
          .eq('project_id', projectId)
          .eq('current_status_id', 7) // Queue status
          .order('queue_position', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        setQueuedTasks(data || []);
      } catch (err: any) {
        console.error("Error fetching queued tasks:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueuedTasks();
    
    // Set up real-time subscription for queue changes
    const subscription = supabase
      .channel('tasks_queue_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId} AND current_status_id=eq.7`
      }, () => {
        fetchQueuedTasks();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [projectId]);

  // Helper function to get priority color
  const getPriorityColor = (task: QueuedTask) => {
    if (!task.priority) return '#9CA3AF'; // Default gray
    
    const priorityColors: Record<string, string> = {
      'Very Low': '#6EE7B7',
      'Low': '#22C55E',
      'Normal': '#FBBF24',
      'Medium': '#F97316',
      'High': '#EF4444',
      'Critical': '#B91C1C'
    };
    
    const priorityName = task.priority.name;
    return priorityColors[priorityName] || task.priority.color || '#9CA3AF';
  };

  // If there are no tasks in queue, we don't show the component at all
  if (!isLoading && queuedTasks.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Task Queue</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <p>Loading queue...</p>
          </div>
        ) : error ? (
          <div className="flex items-center text-red-500 py-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {queuedTasks.map((task) => (
              <div 
                key={task.id}
                className="relative"
              >
                <Badge
                  className="text-xs px-2 py-1 font-normal"
                  style={{
                    backgroundColor: getPriorityColor(task),
                    color: '#fff',
                  }}
                >
                  <span className="mr-1 font-semibold">{task.task_code}</span>
                  <span className="max-w-[100px] truncate hidden sm:inline">
                    {task.details}
                  </span>
                </Badge>
                <span className="absolute -top-2 -right-2 bg-slate-800 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {task.queue_position}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
