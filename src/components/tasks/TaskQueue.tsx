
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  // Group tasks by priority
  const groupedTasks = queuedTasks.reduce((acc, task) => {
    const priorityName = task.priority?.name || 'Unknown';
    if (!acc[priorityName]) {
      acc[priorityName] = [];
    }
    acc[priorityName].push(task);
    return acc;
  }, {} as Record<string, QueuedTask[]>);

  // Helper function to get priority color
  const getPriorityColor = (priorityName: string) => {
    const priorityColors: Record<string, string> = {
      'Very Low': '#6EE7B7',
      'Low': '#9CA3AF',
      'Normal': '#3B82F6',
      'Medium': '#F59E0B',
      'High': '#F97316',
      'Critical': '#EF4444'
    };
    
    return priorityColors[priorityName] || '#9CA3AF'; // Default gray
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
          <div className="space-y-4">
            {Object.entries(groupedTasks).map(([priorityName, tasks]) => (
              <div key={priorityName} className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {tasks.map((task) => (
                    <div 
                      key={task.id}
                      className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${getPriorityColor(priorityName)}15`,
                        borderColor: getPriorityColor(priorityName),
                        color: getPriorityColor(priorityName)
                      }}
                    >
                      <span className="flex items-center">
                        <span 
                          className="w-2 h-2 rounded-full mr-1.5"
                          style={{ backgroundColor: getPriorityColor(priorityName) }}
                        />
                        {task.task_code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
