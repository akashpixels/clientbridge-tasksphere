import { Card } from "@/components/ui/card";
import TasksTable from "./TasksTable";
import { Tables } from "@/integrations/supabase/types";

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
        <p>No tasks found for this project.</p>
      )}
    </Card>
  );
};

export default TasksTabContent;
