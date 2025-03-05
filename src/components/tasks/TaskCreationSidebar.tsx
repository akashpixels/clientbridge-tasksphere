
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskForm } from "./TaskForm";
import { useLayout } from "@/context/layout";
import { X } from "lucide-react";

export const TaskCreationSidebar = () => {
  const { toast } = useToast();
  const { id: projectId } = useParams<{ id: string; }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const { closeRightSidebar } = useLayout();
  const [taskCreated, setTaskCreated] = useState(false);
  const [createdTaskData, setCreatedTaskData] = useState<any>(null);

  const fetchQueuePosition = async () => {
    if (!projectId) return;
    try {
      const {
        count,
        error
      } = await supabase.from('tasks').select('*', {
        count: 'exact',
        head: true
      }).eq('project_id', projectId).in('current_status_id', [1, 2, 3, 6, 7]); // Open, Pending, In Progress, Awaiting Input, In Queue

      if (error) {
        console.error("Error fetching queue position:", error);
        return;
      }
      setQueuePosition(count || 0);
    } catch (error) {
      console.error("Error in fetchQueuePosition:", error);
    }
  };

  useEffect(() => {
    fetchQueuePosition();
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
      const { image_urls, ...taskDataWithoutImages } = formData;
      
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
        description: "Your task has been added to the queue."
      });
      
      // Set task created state and store the created task data
      setTaskCreated(true);
      setCreatedTaskData(data);
      
      // Refresh queue position to update the UI
      fetchQueuePosition();
      
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

  return <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center px-4 py-[10px] border-b bg-[#fcfcfc] sticky top-0 z-10">
        <h2 className="font-semibold text-[14px]">
          {taskCreated 
            ? "Task Created Successfully" 
            : queuePosition > 0 
              ? `# ${queuePosition} task${queuePosition > 1 ? 's' : ''} ahead of this` 
              : 'First in queue'}
        </h2>
        <Button variant="ghost" size="icon" onClick={closeRightSidebar}>
          <X size={18} />
        </Button>
      </div>
      <ScrollArea className="flex-1 px-4 py-2 overflow-y-auto">
        {taskCreated ? (
          <div className="space-y-6 pt-2">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 text-sm mb-2">Your task has been successfully created and added to the queue.</p>
              <div className="text-sm space-y-2 mt-4">
                <h3 className="font-medium">Task Details:</h3>
                <p><span className="font-medium">Description:</span> {createdTaskData?.details}</p>
                <p><span className="font-medium">Queue Position:</span> {queuePosition + 1}</p>
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button onClick={handleAddAnother} className="w-full">
                Add Another Task
              </Button>
            </div>
          </div>
        ) : (
          <TaskForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
            queuePosition={queuePosition} 
          />
        )}
      </ScrollArea>
    </div>;
};
