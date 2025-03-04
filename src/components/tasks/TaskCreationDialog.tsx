
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskForm } from "./TaskForm";

interface TaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskCreationDialog = ({ open, onOpenChange }: TaskCreationDialogProps) => {
  const { toast } = useToast();
  const { id: projectId } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);

  // Fetch the queue position when the dialog opens
  const fetchQueuePosition = async () => {
    if (!projectId) return;
    
    try {
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .in('current_status_id', [1, 2, 3]); // Open, Pending, In Progress
      
      if (error) {
        console.error("Error fetching queue position:", error);
        return;
      }
      
      setQueuePosition(count || 0);
    } catch (error) {
      console.error("Error in fetchQueuePosition:", error);
    }
  };

  // When the dialog opens, fetch the queue position
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      fetchQueuePosition();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (formData: any) => {
    if (!projectId) return;
    
    setIsSubmitting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(userError.message);
      }
      
      // Handle potential image upload to storage (skipped in this implementation)
      // In production, you would upload the image to Supabase Storage first
      // then add the resulting URL to the task data
      
      const taskData = {
        ...formData,
        project_id: projectId,
        created_by: userData.user?.id
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Task created successfully",
        description: "Your task has been added to the queue."
      });
      
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg h-[75vh] max-h-[800px] flex flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 px-6 py-4">
          <TaskForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
            queuePosition={queuePosition}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
