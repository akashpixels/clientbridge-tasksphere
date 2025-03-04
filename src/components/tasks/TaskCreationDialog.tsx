
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TaskForm } from "./TaskForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskCreationDialog = ({ open, onOpenChange }: TaskCreationDialogProps) => {
  const { toast } = useToast();
  const { id: projectId } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[75vh] max-h-[800px] flex flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 px-6 pb-2">
          <TaskForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </ScrollArea>
        
        <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-background z-10">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
