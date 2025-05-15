
import React, { useEffect, useState } from 'react';
import TasksTable from "./TasksTable";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";

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
      type?: 'active' | 'scheduled' | 'completed' | string;
    } | null;
    priority: {
      name: string;
      color_hex: string; 
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
  }, [tasks]);
  
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

  return (
    <div className="p-0">
      {isLoadingTasks ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading tasks...</p>
        </div>
      ) : tasks && tasks.length > 0 ? (
        <div className="overflow-x-auto">
          <TasksTable 
            tasks={tasks}
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
    </div>
  );
};

export default TasksTabContent;
