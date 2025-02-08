
import React from 'react';
import { Tables } from "@/integrations/supabase/types";
import { Link2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CommentsSidebar } from "./CommentsSidebar";
import { TaskStatusCell } from "./table/TaskStatusCell";
import { TaskComplexityCell } from "./table/TaskComplexityCell";
import { TaskPriorityCell } from "./table/TaskPriorityCell";
import { TasksTableHeader } from "./table/TasksTableHeader";
import { TaskDeviceCell } from "./table/TaskDeviceCell";
import { TaskEtaCell } from "./table/TaskEtaCell";
import { TaskImagesCell } from "./table/TaskImagesCell";
import { TaskCommentsCell } from "./table/TaskCommentsCell";

interface TasksTableProps {
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

const TasksTable = ({ tasks, sortConfig, onSort, onImageClick }: TasksTableProps) => {
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const currentUserId = "32259546-212a-4b1b-8f1a-283ac99ac57a"; // TODO: Replace with actual logged-in user ID

  const { data: commentCounts } = useQuery({
    queryKey: ['commentCounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('task_id, created_at', { count: 'exact' })
        .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const counts: { [key: string]: number } = {};
      data.forEach(comment => {
        counts[comment.task_id] = (counts[comment.task_id] || 0) + 1;
      });
      return counts;
    },
  });

  const renderReferenceLinks = (links: Record<string, string> | null) => {
    if (!links) return null;
    
    return Object.entries(links).map(([text, url], index) => (
      <a
        key={index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-gray-800 hover:text-gray-600"
      >
        <Link2 className="w-3 h-3" />
        {text}
      </a>
    ));
  };

  return (
    <>
      <Table>
        <TasksTableHeader sortConfig={sortConfig} onSort={onSort} />
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TaskStatusCell 
                status={task.status}
                completedAt={task.task_completed_at}
                hoursSpent={task.actual_hours_spent}
              />
              <TableCell>
                <div className="flex-1 min-w-0 max-w-[350px]">
                  <p className="text-sm break-words">{task.details}</p>
                  <p className="text-xs text-gray-500 mt-1">{task.task_type?.name}</p>
                </div>
              </TableCell>
              <TaskDeviceCell device={task.target_device} />
              <TaskPriorityCell priority={task.priority} />
              <TaskComplexityCell complexity={task.complexity} />
              <TaskEtaCell eta={task.eta} />
              <TableCell>
                <div className="flex flex-col gap-1">
                  {task.reference_links && renderReferenceLinks(task.reference_links as Record<string, string>)}
                </div>
              </TableCell>
              <TaskImagesCell 
                images={task.images as string[]} 
                onImageClick={onImageClick}
              />
              <TaskCommentsCell
                taskId={task.id}
                commentCount={commentCounts?.[task.id]}
                onCommentClick={setSelectedTaskId}
              />
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CommentsSidebar
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        currentUserId={currentUserId}
      />
    </>
  );
};

export default TasksTable;
