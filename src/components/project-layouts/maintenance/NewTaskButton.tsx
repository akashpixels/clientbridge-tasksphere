
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { TaskCreationDialog } from "@/components/tasks/TaskCreationDialog";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const NewTaskButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const { id: projectId } = useParams<{ id: string }>();
  
  useEffect(() => {
    const fetchQueuePosition = async () => {
      if (!projectId) return;
      
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
    };
    
    fetchQueuePosition();
    
    // Refresh queue position every minute
    const interval = setInterval(fetchQueuePosition, 60000);
    return () => clearInterval(interval);
  }, [projectId]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <PlusCircle size={16} /> New Task {queuePosition > 0 && <span className="ml-1 text-xs">({queuePosition + 1} in queue)</span>}
      </Button>
      <TaskCreationDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
