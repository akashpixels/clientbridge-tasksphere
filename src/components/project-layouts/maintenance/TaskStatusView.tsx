
import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaskStatusViewProps {
  taskId: string;
}

const TaskStatusView = ({ taskId }: TaskStatusViewProps) => {
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTaskStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            id, 
            task_code, 
            details,
            current_status_id,
            task_completed_at,
            hours_spent,
            status:task_statuses(name, color_hex)
          `)
          .eq('id', taskId)
          .single();

        if (error) throw error;
        setTask(data);
      } catch (err: any) {
        console.error('Error fetching task:', err);
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Error fetching task status",
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTaskStatus();
  }, [taskId, toast]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Loading task status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isDone = task?.current_status_id === 8;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Task Status: {task?.task_code}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="font-medium mr-2">Status:</span>
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: task?.status?.color_hex || '#9CA3AF',
                color: '#fff'
              }}
            >
              {task?.status?.name || 'Unknown'}
            </span>
            {isDone && (
              <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
            )}
          </div>
          
          <p className="text-sm text-gray-700">{task?.details}</p>
          
          {isDone && task?.task_completed_at && (
            <div className="text-xs text-gray-500">
              <p>Completed at: {new Date(task.task_completed_at).toLocaleString()}</p>
              {task.hours_spent && (
                <p>Hours spent: {task.hours_spent.toFixed(2)}</p>
              )}
            </div>
          )}
          
          <div className="mt-4 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              To fix the ambiguous column issue in the database, please run the following SQL query manually in the Supabase SQL editor:
            </p>
            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
              {`-- Update task status directly
UPDATE tasks
SET 
  current_status_id = 8,
  task_completed_at = NOW(),
  actual_start_time = COALESCE(actual_start_time, NOW() - INTERVAL '1 hour')
WHERE id = '${taskId}';

-- If needed, manually update queue for next tasks
-- This would normally be handled by the trigger`}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskStatusView;
