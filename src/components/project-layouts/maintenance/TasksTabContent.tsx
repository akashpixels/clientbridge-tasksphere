
import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import TasksTable from "./TasksTable";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import TaskStatusView from "./TaskStatusView";

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
    task_code?: string;
    queue_position?: number;
    start_time?: string | null;
    eta?: string | null;
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
  const { id: projectId } = useParams<{ id: string }>();
  const [showTaskT009Status, setShowTaskT009Status] = useState(false);
  const [taskT009Id, setTaskT009Id] = useState<string | null>(null);
  
  // Add diagnostic output
  useEffect(() => {
    console.log("TasksTabContent rendered with tasks:", tasks?.length || 0);
    console.log("isLoadingTasks:", isLoadingTasks);
    
    // Check if we need to show the special task status view for T009
    const task009 = tasks?.find(task => task.task_code === "T009");
    if (task009) {
      setTaskT009Id(task009.id);
      
      // Show the special view if the URL has a showTaskStatus query param
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('showTaskStatus') === 'T009') {
        setShowTaskT009Status(true);
      }
    }
    
    // Check if we can directly access the tasks table
    const checkTasksAccess = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, details, task_code, queue_position')
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
    <>
      {showTaskT009Status && taskT009Id && (
        <div className="mb-4">
          <TaskStatusView taskId={taskT009Id} />
        </div>
      )}
      
      <Card className="p-0">
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
              onCommentClick={onCommentClick}
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
              <p className="mt-1 text-xs">Project ID: {projectId}</p>
              <p className="mt-1 text-xs">RLS Status: Temporarily disabled</p>
            </div>
          </div>
        )}
      </Card>
    </>
  );
};

export default TasksTabContent;
