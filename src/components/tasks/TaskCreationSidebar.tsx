
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

      // Set task created state and store the created task data
      setTaskCreated(true);
      setCreatedTaskData(data);

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
