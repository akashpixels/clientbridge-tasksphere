
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";

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
}

export const TaskQueue = ({ projectId }: TaskQueueProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState(2); // Default to 2 rows

  useEffect(() => {
    const fetchProjectConcurrency = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('max_concurrent_tasks')
          .eq('id', projectId)
          .single();
        
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
        // Fetch both active and queued tasks
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            id, 
            task_code, 
            details, 
            queue_position, 
            priority_level_id,
            current_status_id,
            priority:priority_levels(name, color),
            status:task_statuses!tasks_current_status_id_fkey(name, color_hex)
          `)
          .eq('project_id', projectId)
          .in('current_status_id', [1, 2, 3, 7]) // Active (Open, Paused, In Progress) and Queue status
          .order('current_status_id', { ascending: true }) // Active tasks first
          .order('queue_position', { ascending: true }); // Then by queue position
        
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

    fetchProjectConcurrency();
    fetchTasks();
    
    // Set up real-time subscription for task changes
    const subscription = supabase
      .channel('tasks_changes')
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

  // Split tasks into active (Open, Paused, In Progress) and queued
  const activeTasks = tasks.filter(task => [1, 2, 3].includes(task.current_status_id));
  const queuedTasks = tasks.filter(task => task.current_status_id === 7);
  
  // Function to split tasks into rows based on max_concurrent_tasks
  const generateTaskRows = () => {
    const rows: Task[][] = Array.from({ length: maxConcurrentTasks }, () => []);
    
    // First, distribute active tasks evenly at the start of each row
    activeTasks.forEach((task, index) => {
      const rowIndex = index % maxConcurrentTasks;
      rows[rowIndex].push(task);
    });
    
    // Then, add queued tasks in a snake pattern
    let currentRow = 0;
    let direction = 1; // 1 for forward, -1 for backward
    
    queuedTasks.forEach((task) => {
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
    <div className="w-[300px] bg-background border border-border/40 rounded-lg shadow-sm">
      <div className="px-4 py-2 border-b border-border/40">
        <h3 className="text-sm font-medium">Task Queue</h3>
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
                {row.map((task) => {
                  const isActive = [1, 2, 3].includes(task.current_status_id);
                  const colorToUse = isActive ? getStatusColor(task) : getPriorityColor(task);
                  
                  return (
                    <div 
                      key={task.id}
                      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${colorToUse}15`,
                        borderColor: colorToUse,
                        color: colorToUse
                      }}
                    >
                      <span className="flex items-center">
                        <span 
                          className="w-1.5 h-1.5 rounded-full mr-1"
                          style={{ backgroundColor: colorToUse }}
                        />
                        {task.task_code}
                        {task.queue_position && (
                          <span className="ml-1 text-[10px] bg-gray-100 px-1 rounded-sm">
                            #{task.queue_position}
                          </span>
                        )}
                        {isActive && (
                          <span className="ml-1 text-[10px] bg-gray-100 px-1 rounded-full">
                            {task.status?.name}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
