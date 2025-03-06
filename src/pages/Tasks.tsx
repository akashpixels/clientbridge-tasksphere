
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskTimeline } from "@/components/tasks/TaskTimeline";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Tasks = () => {
  const [queuedTasks, setQueuedTasks] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchQueuedTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id, 
          task_code, 
          details, 
          queue_position, 
          priority_level_id,
          project_id,
          priority:priority_levels(name, color)
        `)
        .eq('current_status_id', 7) // Queue status
        .order('queue_position', { ascending: true });
      
      if (error) {
        console.error("Error fetching queued tasks:", error);
      } else {
        setQueuedTasks(data || []);
      }
    };
    
    fetchQueuedTasks();
    
    // Real-time subscription for queue changes
    const subscription = supabase
      .channel('tasks_queue_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: 'current_status_id=eq.7'
      }, () => {
        fetchQueuedTasks();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  // Group tasks by project
  const groupedTasks = queuedTasks.reduce((acc: Record<string, any[]>, task) => {
    const projectId = task.project_id;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {});
  
  // Helper function to get priority color
  const getPriorityColor = (task: any) => {
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
          <TaskTimeline />
        </TabsContent>
        
        <TabsContent value="all">
          <div className="grid gap-4">
            {/* Task list will go here */}
            <p>No tasks found.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="assigned">
          <div className="grid gap-4">
            {/* Assigned tasks will go here */}
            <p>No assigned tasks found.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="completed">
          <div className="grid gap-4">
            {/* Completed tasks will go here */}
            <p>No completed tasks found.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="queued">
          <div className="grid gap-4">
            {Object.entries(groupedTasks).length > 0 ? (
              Object.entries(groupedTasks).map(([projectId, tasks]) => (
                <Card key={projectId} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Queue for Project {projectId.substring(0, 8)}...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {tasks.map((task) => (
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
                  </CardContent>
                </Card>
              ))
            ) : (
              <p>No tasks in queue.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tasks;
