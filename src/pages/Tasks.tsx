import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams } from "react-router-dom";
import { AlertCircle, Server } from "lucide-react";
import { StartEtaPredictor } from "@/components/tasks/StartEtaPredictor";

type QueuedTask = {
  id: string;
  task_code?: string | null;
  details: string;
  priority_level_id: number;
  project_id: string;
  priority?: {
    name: string;
    color: string;
  } | null;
};

type GroupedTasks = Record<string, QueuedTask[]>;

const Tasks = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const [queuedTasks, setQueuedTasks] = useState<QueuedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  
  useEffect(() => {
    const fetchQueuedTasks = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            id, 
            task_code, 
            details, 
            priority_level_id,
            project_id,
            priority:priority_levels(name, color)
          `)
          .eq('current_status_id', 7) // Queue status
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error("Error fetching queued tasks:", error);
        } else {
          setQueuedTasks(data || []);
        }
        
        const { data: activeData, error: activeError } = await supabase
          .from('tasks')
          .select('id')
          .eq('project_id', projectId)
          .in('current_status_id', [2, 3, 4, 5]) // Active statuses
          
        if (activeError) {
          console.error("Error fetching active tasks:", activeError);
        } else {
          setActiveTaskCount(activeData?.length || 0);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQueuedTasks();
    
    const subscription = supabase
      .channel('project_timeline_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId}`
      }, () => {
        fetchQueuedTasks();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [projectId]);
  
  const groupedTasks: GroupedTasks = queuedTasks.reduce((acc: GroupedTasks, task) => {
    const projectId = task.project_id;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {});
  
  const getPriorityColor = (task: QueuedTask) => {
    if (!task.priority) return '#9CA3AF';
    
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Tasks</h1>
      
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="queued">Queue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline">
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Task Timeline</h2>
            {projectId && (
              <StartEtaPredictor 
                projectId={projectId}
                taskTypeId={null}
                priorityLevelId={null}
                complexityLevelId={3}
                compact={false}
                activeTaskCount={activeTaskCount}
              />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="all">
          <div className="grid gap-4">
            <p>No tasks found.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="assigned">
          <div className="grid gap-4">
            <p>No assigned tasks found.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="completed">
          <div className="grid gap-4">
            <p>No completed tasks found.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="queued">
          <div className="grid gap-4">
            {isLoading ? (
              <Card className="shadow-sm">
                <CardContent className="p-6 text-center">
                  <Server className="h-12 w-12 mx-auto text-gray-300 mb-2 animate-pulse" />
                  <p>Loading task queue...</p>
                </CardContent>
              </Card>
            ) : Object.entries(groupedTasks).length > 0 ? (
              Object.entries(groupedTasks).map(([projectId, tasks]) => (
                <Card key={projectId} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Queue for Project {projectId.substring(0, 8)}...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {tasks.map((task, index) => (
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
                            {index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-amber-300 mb-2" />
                  <p>No tasks in queue.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tasks;
