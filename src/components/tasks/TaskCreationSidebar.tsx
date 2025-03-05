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
  const [formData, setFormData] = useState<any>(null);

  const fetchQueuePosition = async () => {
    if (!projectId) return;
    try {
      const {
        count,
        error
      } = await supabase.from('tasks').select('*', {
        count: 'exact',
        head: true
      }).eq('project_id', projectId).in('current_status_id', [1, 2, 3]); // Open, Pending, In Progress

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

  const handleFormSubmit = (data: any) => {
    setFormData(data);
  };

  const handleSubmit = async () => {
    if (!projectId || !formData) return;
    setIsSubmitting(true);
    try {
      const {
        data: userData,
        error: userError
      } = await supabase.auth.getUser();
      if (userError) {
        throw new Error(userError.message);
      }
      const taskData = {
        ...formData,
        project_id: projectId,
        created_by: userData.user?.id
      };
      const {
        data,
        error
      } = await supabase.from('tasks').insert(taskData).select().single();
      if (error) {
        throw error;
      }
      toast({
        title: "Task created successfully",
        description: "Your task has been added to the queue."
      });
      closeRightSidebar();
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

  return <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center px-4 py-[10px] border-b bg-[#fcfcfc] sticky top-0 z-10">
        <h2 className="font-semibold text-[14px]">
          {queuePosition > 0 ? `# ${queuePosition} task${queuePosition > 1 ? 's' : ''} ahead of this` : 'First in queue'}
        </h2>
        <Button variant="ghost" size="icon" onClick={closeRightSidebar}>
          <X size={18} />
        </Button>
      </div>
      <ScrollArea className="flex-1 px-4 py-2 overflow-y-auto">
        <TaskForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} queuePosition={queuePosition} />
      </ScrollArea>
      <div className="px-4 py-3 border-t sticky bottom-0 bg-white z-10">
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </div>
    </div>;
};
