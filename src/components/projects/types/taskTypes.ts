
import { Tables } from "@/integrations/supabase/types";

export type TaskWithRelations = Tables<"tasks"> & {
  task_type: {
    name: string;
    category: string;
  } | null;
  status: {
    name: string;
    color_hex: string | null;
    type?: string | null;
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
  queue_position?: number;
  is_awaiting_input?: boolean;
  is_onhold?: boolean;
  est_start?: string | null;
  est_end?: string | null;
  actual_duration?: number | null; 
  logged_duration?: number | null; 
  completed_at?: string | null;
};

export interface TasksTableProps {
  tasks: TaskWithRelations[];
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc';
  };
  onSort: (key: string) => void;
  onImageClick: (image: string, images: string[]) => void;
  onCommentClick: (taskId: string) => void;
  selectedTaskId?: string;
}

export interface TaskRowProps {
  task: TaskWithRelations;
  onCommentClick: (taskId: string) => void;
  onImageClick: (image: string, images: string[]) => void;
  isSelected: boolean;
}

export interface TaskSectionProps {
  title: string;
  taskList: TaskWithRelations[];
  onCommentClick: (taskId: string) => void;
  onImageClick: (image: string, images: string[]) => void;
  selectedTaskId?: string;
}
