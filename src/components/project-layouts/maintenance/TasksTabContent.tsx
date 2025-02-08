
import { Card } from "@/components/ui/card";
import TasksTable from "./TasksTable";
import { Tables } from "@/integrations/supabase/types";
import { useEffect } from "react";
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
}

const TasksTabContent = ({
  isLoadingTasks,
  tasks,
  sortConfig,
  onSort,
  onImageClick,
}: TasksTabContentProps) => {
  useEffect(() => {
    // Subscribe to realtime updates for comments
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
        <p>Loading tasks...</p>
      ) : tasks && tasks.length > 0 ? (
        <div className="overflow-x-auto">
          <TasksTable 
            tasks={tasks}
            sortConfig={sortConfig}
            onSort={onSort}
            onImageClick={onImageClick}
          />
        </div>
      ) : (
        <p className="p-6">No tasks found for this project.</p>
      )}
    </Card>
  );
};

export default TasksTabContent;
