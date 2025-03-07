
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TaskActionsProps {
  taskId: string;
  taskCode: string;
  currentStatusId: number;
  onStatusChange?: () => void;
}

export const TaskActions = ({ taskId, taskCode, currentStatusId, onStatusChange }: TaskActionsProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleMarkAsDone = async () => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('tasks')
        .update({ current_status_id: 8 }) // 8 is the "Done" status ID
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      toast({
        title: "Task completed",
        description: `Task ${taskCode} has been marked as done.`,
        variant: "default",
      });
      
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Error marking task as done:", error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // If the task is already done, don't show the button
  if (currentStatusId === 8) {
    return (
      <div className="flex items-center text-green-600 gap-1 text-xs">
        <Check className="h-4 w-4" /> Completed
      </div>
    );
  }

  return (
    <Button 
      size="sm" 
      variant="outline" 
      className="text-xs h-8" 
      onClick={handleMarkAsDone}
      disabled={isUpdating}
    >
      {isUpdating ? (
        <Clock className="h-3 w-3 mr-1 animate-spin" />
      ) : (
        <Check className="h-3 w-3 mr-1" />
      )}
      Mark Done
    </Button>
  );
};
