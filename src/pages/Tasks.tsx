
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Task = {
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

type GroupedTasks = Record<string, Task[]>;

const Tasks = () => {
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  
  useEffect(() => {
    const fetchActiveTasks = async () => {
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
        .in('current_status_id', [1, 2, 3]) // Active statuses (Open, Pending, In Progress)
        .order('priority_level_id', { ascending: true });
      
      if (error) {
        console.error("Error fetching active tasks:", error);
      } else {
        setActiveTasks(data || []);
      }
    };
    
    fetchActiveTasks();
    
    // Real-time subscription for task changes
    const subscription = supabase
      .channel('tasks_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks'
      }, () => {
        fetchActiveTasks();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  // Group tasks by project
  const groupedTasks: GroupedTasks = activeTasks.reduce((acc: GroupedTasks, task) => {
    const projectId = task.project_id;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {});
  
  // Helper function to get priority color
  const getPriorityColor = (task: Task) => {
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
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid gap-4">
            {Object.entries(groupedTasks).length > 0 ? (
              Object.entries(groupedTasks).map(([projectId, tasks]) => (
                <Card key={projectId} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Project {projectId.substring(0, 8)}...</CardTitle>
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
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p>No active tasks found.</p>
            )}
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
      </Tabs>
    </div>
  );
};

export default Tasks;
