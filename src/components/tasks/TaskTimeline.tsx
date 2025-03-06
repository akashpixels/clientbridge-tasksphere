
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TimelineVisualization } from "./TimelineVisualization";

interface TaskTimelineProps {
  projectId?: string;
}

interface TimelineTask {
  id: string;
  details: string;
  calculated_start_time: string;
  calculated_eta: string;
  channel_id: number;
  position_in_channel: number;
  timeline_status: string;
  priority_level_id: number;
  complexity_level_id: number;
  task_type_id: number;
  channel_load: number;
  total_tasks_in_project: number;
  task_code?: string | null;
  queue_position?: number | null;
  task_type?: {
    name: string;
  } | null;
  priority?: {
    name: string;
    color: string;
  } | null;
  status?: {
    name: string;
    color_hex: string | null;
  } | null;
}

export const TaskTimeline = ({ projectId }: TaskTimelineProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TimelineTask | null>(null);

  useEffect(() => {
    const fetchTimelineTasks = async () => {
      setIsLoading(true);
      try {
        // First, let's check if task_code and queue_position exist in task_timelines view
        const { data: checkData, error: checkError } = await supabase
          .from('tasks')
          .select('task_code, queue_position')
          .limit(1);
          
        console.log("Check for task_code and queue_position:", checkData, checkError);
        
        // Fetch tasks from the task_timelines view
        const { data, error } = await supabase
          .from('tasks')  // Changed from task_timelines to tasks
          .select(`
            id, details, created_at, eta, 
            priority_level_id, complexity_level_id, task_type_id,
            current_status_id, task_code, queue_position,
            task_type:task_types(name),
            priority:priority_levels(name, color),
            status:task_statuses!tasks_current_status_id_fkey(name, color_hex)
          `)
          .eq('project_id', projectId || 'all')
          .in('current_status_id', [1, 2, 3, 6, 7]) // Only active tasks
          .order('priority_level_id')
          .order('created_at');
        
        if (error) {
          console.error("Error fetching timeline tasks:", error);
          throw error;
        }
        
        console.log("Timeline tasks:", data);
        
        // Transform the data to match what the TimelineTask interface expects
        const transformedData: TimelineTask[] = (data || []).map((task: any) => {
          const statusMap: Record<number, string> = {
            1: 'open', 
            2: 'pending',
            3: 'in_progress',
            6: 'waiting',
            7: 'queued'
          };
          
          return {
            id: task.id,
            details: task.details,
            calculated_start_time: task.created_at,
            calculated_eta: task.eta || new Date().toISOString(),
            channel_id: task.current_status_id === 7 ? 3 : task.current_status_id === 3 ? 1 : 2,
            position_in_channel: task.queue_position || 0,
            timeline_status: statusMap[task.current_status_id] || 'scheduled',
            priority_level_id: task.priority_level_id,
            complexity_level_id: task.complexity_level_id,
            task_type_id: task.task_type_id,
            channel_load: 0,
            total_tasks_in_project: 0,
            task_code: task.task_code,
            queue_position: task.queue_position,
            task_type: task.task_type,
            priority: task.priority,
            status: task.status
          };
        });
        
        setTasks(transformedData);
        
        // Set the first task as selected by default if available
        if (transformedData && transformedData.length > 0) {
          setSelectedTask(transformedData[0]);
        }
      } catch (error) {
        console.error("Error in fetchTimelineTasks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimelineTasks();
  }, [projectId]);

  const getStatusColor = (status: string) => {
    const colors = {
      completed: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      waiting: "bg-amber-100 text-amber-800",
      queued: "bg-purple-100 text-purple-800",
      scheduled: "bg-gray-100 text-gray-800"
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold">Task Timeline</h3>
        <p className="text-sm text-gray-500">Visualize and track task progress through the workflow</p>
      </div>
      
      {tasks.length === 0 ? (
        <Card className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-lg font-medium">No active tasks found</p>
          <p className="mt-1 text-sm text-gray-500">Add new tasks to see them in the timeline view</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Task lanes */}
            {[1, 2, 3].map(channelId => {
              const channelTasks = tasks.filter(t => t.channel_id === channelId);
              const channelTitle = channelId === 1 ? "In Progress" : 
                                  channelId === 2 ? "Next Up" : 
                                  "Scheduled";
              
              return (
                <Card key={channelId} className="overflow-hidden">
                  <div className={`py-2 px-4 font-medium text-sm ${
                    channelId === 1 ? "bg-blue-50 text-blue-800" : 
                    channelId === 2 ? "bg-purple-50 text-purple-800" : 
                    "bg-gray-50 text-gray-800"
                  }`}>
                    {channelTitle} ({channelTasks.length})
                  </div>
                  <CardContent className="p-3">
                    {channelTasks.length === 0 ? (
                      <div className="text-center py-8 text-sm text-gray-500">
                        No tasks in this lane
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {channelTasks.map(task => (
                          <div 
                            key={task.id}
                            className={`p-3 rounded-md border cursor-pointer transition-colors ${
                              selectedTask?.id === task.id 
                                ? "border-blue-300 bg-blue-50" 
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => setSelectedTask(task)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex gap-2 items-center">
                                {task.task_code && (
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {task.task_code}
                                    {task.queue_position && (
                                      <span className="ml-1 text-[10px] bg-gray-100 px-1 rounded-full">
                                        #{task.queue_position}
                                      </span>
                                    )}
                                  </Badge>
                                )}
                                <span className="text-sm font-medium truncate max-w-[70%]">
                                  {task.details}
                                </span>
                              </div>
                              <Badge className={getStatusColor(task.timeline_status)}>
                                {task.timeline_status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(new Date(task.calculated_eta), "MMM d, h:mm a")}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {task.task_type?.name || "Task"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Task details with timeline visualization */}
          {selectedTask && (
            <Card className="p-4">
              <div className="mb-4">
                <div className="flex gap-2 items-center mb-1">
                  {selectedTask.task_code && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {selectedTask.task_code}
                      {selectedTask.queue_position && (
                        <span className="ml-1 text-[10px] bg-gray-100 px-1 rounded-full">
                          #{selectedTask.queue_position}
                        </span>
                      )}
                    </Badge>
                  )}
                  <h4 className="text-lg font-medium">{selectedTask.details}</h4>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(selectedTask.timeline_status)}>
                    {selectedTask.timeline_status.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {selectedTask.task_type?.name}
                  </span>
                </div>
              </div>
              
              <TimelineVisualization 
                taskTypeId={selectedTask.task_type_id}
                priorityLevelId={selectedTask.priority_level_id}
                complexityLevelId={selectedTask.complexity_level_id}
                compact={true}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
};
