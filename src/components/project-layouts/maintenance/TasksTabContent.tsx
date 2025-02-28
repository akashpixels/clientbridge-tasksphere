
import React, { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import TasksTable from "./TasksTable";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

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
      color: string;
    } | null;
    complexity: {
      name: string;
      multiplier: number;
    } | null;
    assigned_user: {
      first_name: string;
      last_name: string;
    } | null;
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
  
  // Add diagnostic output
  useEffect(() => {
    console.log("TasksTabContent rendered with tasks:", tasks?.length || 0);
    console.log("isLoadingTasks:", isLoadingTasks);
    
    // Check if we can directly access the tasks table
    const checkTasksAccess = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, details')
          .limit(5);
          
        console.log("Direct tasks access test:", data?.length || 0, data);
        console.log("Direct tasks access error:", error);
      } catch (e) {
        console.error("Error in direct tasks check:", e);
      }
    };
    
    checkTasksAccess();
  }, [tasks, isLoadingTasks]);
  
  useEffect(() => {
    const channel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments'
        },
        (payload) => {
          console.log('Comment change received:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="p-0">
      {isLoadingTasks ? (
        <p className="p-6">Loading tasks...</p>
      ) : tasks && tasks.length > 0 ? (
        <div className="overflow-x-auto">
          <TasksTable 
            tasks={tasks}
            sortConfig={sortConfig}
            onSort={onSort}
            onImageClick={onImageClick}
            onCommentClick={onCommentClick}
          />
        </div>
      ) : (
        <div className="p-6">
          <p>No tasks found for this project.</p>
          <p className="text-sm text-gray-400 mt-2">This could be due to permission settings or because no tasks exist.</p>
        </div>
      )}
    </Card>
  );
};

export default TasksTabContent;
