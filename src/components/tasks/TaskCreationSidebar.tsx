
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskForm } from "./TaskForm";
import { useLayout } from "@/context/layout";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [createdTaskData, setCreatedTaskData] = useState<any>(null);

  const fetchActiveTaskCount = async () => {
    if (!projectId) return;
    try {
      // Count active tasks directly from the tasks table
      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', projectId)
        .in('current_status_id', [2, 3, 4, 5, 6, 7]) // Active task statuses
        .is('task_completed_at', null);

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
      const processedData = { ...data };
      
      if (processedData && processedData.actual_hours_spent) {
        // Add the formatted property to the data object
        processedData.actual_hours_spent_formatted = formatIntervalForDisplay(processedData.actual_hours_spent);
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center px-4 border-b sticky top-0 z-10 py-[5px] bg-background">
        <h2 className="font-semibold text-[14px]">
          {taskCreated 
            ? "Task Created Successfully" 
            : activeTaskCount > 0 
              ? `${activeTaskCount} active task${activeTaskCount > 1 ? 's' : ''}` 
              : 'No active tasks'
          }
        </h2>
        <Button variant="ghost" size="icon" onClick={closeRightSidebar}>
          <X size={18} />
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {taskCreated ? (
          <ScrollArea className="h-full px-4 py-2">
            <div className="space-y-6 pt-2 pb-20">
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
                </div>
              </div>
              
              <div className="sticky bottom-0 py-4 mt-6 bg-background">
                <Button onClick={handleAddAnother} className="w-full">
                  Add Another Task
                </Button>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <TaskForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
            activeTaskCount={activeTaskCount} 
          />
        )}
      </div>
    </div>
  );
};
