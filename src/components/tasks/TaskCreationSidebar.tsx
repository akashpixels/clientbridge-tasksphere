
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import TaskForm from "./TaskForm";
import { useLayout } from "@/context/layout";
import { X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define a type for the task data that includes the formatted property
interface TaskData {
  id: string;
  task_code?: string;
  details: string;
  current_status_id: number;
  priority_level_id: number;
  actual_duration?: any;
  actual_duration_formatted?: string;
  is_onhold?: boolean;
  is_awaiting_input?: boolean;
  [key: string]: any; // Allow other properties
}

// Helper function to format interval for display
const formatIntervalForDisplay = (intervalValue: any): string => {
  if (!intervalValue) return "0h";
  
  // Handle if intervalValue is already a number
  if (typeof intervalValue === 'number') {
    return intervalValue === 0 ? "0h" : `${intervalValue}h`;
  }
  
  // Convert PostgreSQL interval string formats to hours
  try {
    if (typeof intervalValue === 'string') {
      // Handle "HH:MM:SS" format
      if (intervalValue.includes(':')) {
        const parts = intervalValue.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const minutesAsHours = minutes / 60;
        return `${(hours + minutesAsHours).toFixed(1).replace(/\.0$/, '')}h`;
      }
      // Handle "X hours Y minutes" format
      else if (intervalValue.includes('hours') || intervalValue.includes('hour')) {
        const hoursMatch = intervalValue.match(/(\d+)\s+hours?/);
        const minutesMatch = intervalValue.match(/(\d+)\s+minutes?/);
        const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
        const minutesAsHours = minutes / 60;
        return `${(hours + minutesAsHours).toFixed(1).replace(/\.0$/, '')}h`;
      }
      // Try to parse as a raw number
      return `${parseFloat(intervalValue)}h`;
    }
    
    // Handle interval object format from PostgreSQL
    if (typeof intervalValue === 'object' && intervalValue !== null) {
      // Convert interval object to string and extract hours
      const stringValue = String(intervalValue);
      return formatIntervalForDisplay(stringValue);
    }
    
    return "0h";
  } catch (e) {
    console.error("Error formatting interval:", e, intervalValue);
    return "0h";
  }
};

export const TaskCreationSidebar = () => {
  const { toast } = useToast();
  const { id: projectId } = useParams<{ id: string; }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  const { closeRightSidebar } = useLayout();
  const [taskCreated, setTaskCreated] = useState(false);
  const [createdTaskData, setCreatedTaskData] = useState<TaskData | null>(null);

  const fetchActiveTaskCount = async () => {
    if (!projectId) return;
    try {
      // Count active tasks directly from the tasks table
      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', projectId)
        .in('current_status_id', [2, 3, 4, 5, 6, 7]) // Active task statuses
        .is('completed_at', null); // Updated from task_completed_at to completed_at

      if (error) {
        console.error("Error fetching active tasks:", error);
        return;
      }
      
      setActiveTaskCount(data?.length || 0);
    } catch (error) {
      console.error("Error in fetchActiveTaskCount:", error);
    }
  };

  useEffect(() => {
    fetchActiveTaskCount();
  }, [projectId]);

  const handleSubmit = async (formData: any) => {
    if (!projectId) return;
    console.log("Submitting form data:", formData);
    setIsSubmitting(true);
    try {
      const {
        data: userData,
        error: userError
      } = await supabase.auth.getUser();
      if (userError) {
        throw new Error(userError.message);
      }

      // Prepare task data for submission by excluding fields that don't exist in the tasks table
      const {
        image_urls,
        ...taskDataWithoutImages
      } = formData;
      const taskData = {
        ...taskDataWithoutImages,
        project_id: projectId,
        created_by: userData.user?.id
      };
      console.log("Sending task data to supabase:", taskData);
      const {
        data,
        error
      } = await supabase.from('tasks').insert(taskData).select().single();
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      console.log("Task created successfully:", data);
      toast({
        title: "Task created successfully",
        description: "Your task has been added to the project."
      });

      // Process interval fields for display and add to task data
      const processedData: TaskData = { ...data };
      
      if (processedData && processedData.actual_duration) {
        // Add the formatted property to the data object
        processedData.actual_duration_formatted = formatIntervalForDisplay(processedData.actual_duration);
      }

      // Set task created state and store the created task data
      setTaskCreated(true);
      setCreatedTaskData(processedData);

      // Refresh active task count
      fetchActiveTaskCount();
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setTaskCreated(false);
    setCreatedTaskData(null);
  };

  // Function to render task status badges
  const renderTaskStatusBadges = (task: TaskData) => {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {task.is_onhold && (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            On Hold
          </Badge>
        )}
        {task.is_awaiting_input && (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Awaiting Input
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-4 border-b sticky top-0 z-20 py-2 bg-background">
        <h2 className="font-semibold text-[14px]">
          {taskCreated 
            ? "Task Created Successfully" 
            : activeTaskCount > 0 
              ? `${activeTaskCount}  task${activeTaskCount > 1 ? 's' : ''} ahead` 
              : 'No active tasks'
          }
        </h2>
        <Button variant="ghost" size="icon" onClick={closeRightSidebar}>
          <X size={18} />
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {taskCreated ? (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-800 text-sm mb-2">Your task has been successfully created and added to the project.</p>
                  <div className="text-sm space-y-2 mt-4">
                    <h3 className="font-medium">Task Details:</h3>
                    <div className="flex gap-2 items-center">
                      {createdTaskData?.task_code && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {createdTaskData.task_code}
                        </Badge>
                      )}
                      <p><span className="font-medium">Description:</span> {createdTaskData?.details}</p>
                    </div>
                    <p><span className="font-medium">Status:</span> {createdTaskData?.current_status_id === 1 ? 'Open' : 'Pending'}</p>
                    <p><span className="font-medium">Priority:</span> {createdTaskData?.priority_level_id}</p>
                    
                    {/* Render status badges if task is on hold or awaiting input */}
                    {createdTaskData && renderTaskStatusBadges(createdTaskData)}
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <div className="border-t p-4 bg-background sticky bottom-0 z-10">
              <Button onClick={handleAddAnother} className="w-full">
                Add Another Task
              </Button>
            </div>
          </div>
        ) : (
          <TaskForm 
            projectId={projectId || ''} 
            onClose={closeRightSidebar} 
          />
        )}
      </div>
    </div>
  );
};
