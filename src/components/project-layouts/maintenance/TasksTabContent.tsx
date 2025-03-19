
import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import TasksTable from "./TasksTable";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";

/**
 * The calculate_total_blocking_time SQL function calculates the total time a task has been blocked:
 * 
 * 1. It sums up all completed blocking periods (where ended_at is set)
 * 2. It adds any ongoing blocking periods (where ended_at is NULL, using current_timestamp)
 * 3. Returns the total as an interval type
 * 
 * SQL function signature:
 * CREATE OR REPLACE FUNCTION calculate_total_blocking_time(task_id UUID)
 * RETURNS INTERVAL AS $$
 * DECLARE
 *   total_time INTERVAL := '0 seconds'::INTERVAL;
 * BEGIN
 *   -- Sum up all completed blocking periods
 *   SELECT COALESCE(SUM(ended_at - started_at), '0 seconds'::INTERVAL) INTO total_time
 *   FROM task_blocking_history
 *   WHERE task_id = $1 AND ended_at IS NOT NULL;
 *   
 *   -- Add any ongoing blocking periods
 *   SELECT total_time + COALESCE(SUM(CURRENT_TIMESTAMP - started_at), '0 seconds'::INTERVAL) INTO total_time
 *   FROM task_blocking_history
 *   WHERE task_id = $1 AND ended_at IS NULL;
 *   
 *   RETURN total_time;
 * END;
 * $$ LANGUAGE plpgsql;
 */

interface TasksTabContentProps {
  isLoadingTasks: boolean;
  tasks: (Tables<"tasks"> & {
    task_type: {
      name: string;
      category: string;
    } | null;
    status: {
      name: string;
      color_hex: string | null;
    } | null;
    priority: {
      name: string;
      color_hex: string; // Updated from color to color_hex
    } | null;
    complexity: {
      name: string;
      multiplier: number;
    } | null;
    assigned_user: {
      first_name: string;
      last_name: string;
    } | null;
    task_code?: string;
    is_awaiting_input?: boolean;
    is_onhold?: boolean;
    est_start?: string | null;
    est_end?: string | null;
    queue_position?: number;
    actual_duration?: number | null;     
    logged_duration?: number | null;
    completed_at?: string | null;        
  })[];
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc';
  };
  onSort: (key: string) => void;
  onImageClick: (image: string, images: string[]) => void;
  onCommentClick: (taskId: string) => void;
}

const TasksTabContent = ({
  isLoadingTasks,
  tasks,
  sortConfig,
  onSort,
  onImageClick,
  onCommentClick,
}: TasksTabContentProps) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    console.log("TasksTabContent rendered with tasks:", tasks?.length || 0);
    console.log("isLoadingTasks:", isLoadingTasks);
    
    const checkTasksAccess = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, details, task_code, current_status_id, is_onhold, is_awaiting_input')
          .limit(5);
          
        console.log("Direct tasks access test:", data?.length || 0);
        if (error) {
          console.error("Direct tasks access error:", error);
        }
      } catch (e) {
        console.error("Error in direct tasks check:", e);
      }
    };
    
    checkTasksAccess();
  }, [tasks, isLoadingTasks]);
  
  useEffect(() => {
    const channel = supabase
      .channel('task-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_blocking_history'
        },
        (payload) => {
          console.log('Task blocking status change received:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    onCommentClick(taskId);
  };

  // Process the tasks data to ensure actual_duration and logged_duration are properly converted to numbers
  const processedTasks = tasks?.map(task => ({
    ...task,
    actual_duration: typeof task.actual_duration === 'object' && task.actual_duration !== null
      ? parseFloat(String(task.actual_duration)) || 0
      : (typeof task.actual_duration === 'string'
          ? parseFloat(task.actual_duration) || 0
          : (typeof task.actual_duration === 'number' 
              ? task.actual_duration
              : null)),
    logged_duration: typeof task.logged_duration === 'object' && task.logged_duration !== null
      ? parseFloat(String(task.logged_duration)) || 0
      : (typeof task.logged_duration === 'string'
          ? parseFloat(task.logged_duration) || 0
          : (typeof task.logged_duration === 'number' 
              ? task.logged_duration
              : null))
  })) || [];

  return (
    <Card className="p-0">
      {isLoadingTasks ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading tasks...</p>
        </div>
      ) : processedTasks && processedTasks.length > 0 ? (
        <div className="overflow-x-auto">
          <TasksTable 
            tasks={processedTasks}
            sortConfig={sortConfig}
            onSort={onSort}
            onImageClick={onImageClick}
            onCommentClick={handleTaskClick}
            selectedTaskId={selectedTaskId}
          />
        </div>
      ) : (
        <div className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <p className="text-lg font-semibold">No tasks found for this project.</p>
          <p className="text-sm text-gray-500 mt-2">
            This could be due to permission settings or because no tasks exist for this project.
          </p>
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-left">
            <p className="font-medium">Debugging information:</p>
            <p className="mt-1 text-xs">Project ID: {window.location.pathname.split('/').pop()}</p>
            <p className="mt-1 text-xs">Status: Simplified timeline calculation active</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TasksTabContent;
