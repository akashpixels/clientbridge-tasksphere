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
  const {
    toast
  } = useToast();
  const {
    id: projectId
  } = useParams<{
    id: string;
  }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  const {
    closeRightSidebar
  } = useLayout();
  const [taskCreated, setTaskCreated] = useState(false);
  const [createdTaskData, setCreatedTaskData] = useState<any>(null);
  const fetchActiveTaskCount = async () => {
    if (!projectId) return;
    try {
      const {
        count,
        error
      } = await supabase.from('tasks').select('*', {
        count: 'exact',
        head: true
      }).eq('project_id', projectId).in('current_status_id', [1, 2, 3, 6]); // Open, Pending, In Progress, Awaiting Input

      if (error) {
        console.error("Error fetching active task count:", error);
        return;
      }
      setActiveTaskCount(count || 0);
    } catch (error) {
      console.error("Error in fetchActiveTaskCount:", error);
    }
  };
  useEffect(() => {
    fetchActiveTaskCount();
  }, []);
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

  // Helper function to get priority name
  const getPriorityName = async (priorityId: number) => {
    try {
      const {
        data,
        error
      } = await supabase.from('priority_levels').select('name').eq('id', priorityId).single();
      if (error) throw error;
      return data?.name || 'Unknown';
    } catch (error) {
      console.error('Error fetching priority name:', error);
      return 'Unknown';
    }
  };
  return <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center px-4 border-b sticky top-0 z-10 py-[5px]">
        <h2 className="font-semibold text-[14px]">
          {taskCreated ? "Task Created Successfully" : activeTaskCount > 0 ? `${activeTaskCount} active task${activeTaskCount > 1 ? 's' : ''}` : 'No active tasks'}
        </h2>
        <Button variant="ghost" size="icon" onClick={closeRightSidebar}>
          <X size={18} />
        </Button>
      </div>
      <ScrollArea className="flex-1 px-4 py-2 overflow-y-auto">
        {taskCreated ? <div className="space-y-6 pt-2">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 text-sm mb-2">Your task has been successfully created and added to the project.</p>
              <div className="text-sm space-y-2 mt-4">
                <h3 className="font-medium">Task Details:</h3>
                <div className="flex gap-2 items-center">
                  {createdTaskData?.task_code && <Badge variant="outline" className="font-mono text-xs">
                      {createdTaskData.task_code}
                    </Badge>}
                  <p><span className="font-medium">Description:</span> {createdTaskData?.details}</p>
                </div>
                <p><span className="font-medium">Status:</span> {createdTaskData?.current_status_id === 1 ? 'Open' : 'Pending'}</p>
                <p><span className="font-medium">Priority:</span> {createdTaskData?.priority_level_id}</p>
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button onClick={handleAddAnother} className="w-full">
                Add Another Task
              </Button>
            </div>
          </div> : <TaskForm onSubmit={handleSubmit} isSubmitting={isSubmitting} activeTaskCount={activeTaskCount} />}
      </ScrollArea>
    </div>;
};
