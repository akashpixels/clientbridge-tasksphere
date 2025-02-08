
import React from 'react';
import { Tables } from "@/integrations/supabase/types";
import { Monitor, Smartphone, ArrowUp, ArrowDown, Maximize, Link2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CommentsSidebar } from "./CommentsSidebar";
import { TaskStatusCell } from "./table/TaskStatusCell";
import { TaskComplexityCell } from "./table/TaskComplexityCell";
import { TaskPriorityCell } from "./table/TaskPriorityCell";

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
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('status')}
            >
              Status {sortConfig.key === 'status' && (
                sortConfig.direction === 'asc' ? <ArrowUp className="inline w-4 h-4" /> : <ArrowDown className="inline w-4 h-4" />
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('details')}
            >
              Details
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('target_device')}
            >
              Device
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('priority_level_id')}
            >
              Priority
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('complexity_level_id')}
            >
              Level
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('eta')}
            >
              ETA
            </TableHead>
            <TableHead>Links</TableHead>
            <TableHead>Assets</TableHead>
            <TableHead>Comments</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <TaskStatusCell 
                  status={task.status}
                  completedAt={task.task_completed_at}
                  hoursSpent={task.actual_hours_spent}
                />
              </TableCell>
              <TableCell>
                <div className="flex-1 min-w-0 max-w-[350px]">
                  <p className="text-sm break-words">{task.details}</p>
                  <p className="text-xs text-gray-500 mt-1">{task.task_type?.name}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {task.target_device === 'Desktop' && <Monitor className="w-4 h-4 text-gray-500" />}
                  {task.target_device === 'Mobile' && <Smartphone className="w-4 h-4 text-gray-500" />}
                  {task.target_device === 'Both' && (
                    <>
                      <Monitor className="w-4 h-4 text-gray-500" />
                      <Smartphone className="w-4 h-4 text-gray-500" />
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <TaskPriorityCell priority={task.priority} />
              </TableCell>
              <TableCell>
                <TaskComplexityCell complexity={task.complexity} />
              </TableCell>
              <TableCell className="text-left">
                {task.eta ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-600">{format(new Date(task.eta), "h.mmaaa")}</span>
                    <span className="text-xs text-gray-700">{format(new Date(task.eta), "do MMM")}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-700">Not set</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {task.reference_links && renderReferenceLinks(task.reference_links as Record<string, string>)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex -space-x-2">
                  {task.images && Array.isArray(task.images) && task.images.length > 0 && (
                    task.images.map((image, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 relative cursor-pointer"
                        onClick={() => onImageClick(image as string, task.images as string[])}
                      >
                        <img 
                          src={image as string}
                          alt={`Task image ${index + 1}`}
                          className="w-8 h-8 rounded-lg border-2 border-white object-cover"
                        />
                        <Maximize className="w-3 h-3 absolute top-0 right-0 text-gray-600 bg-white rounded-full p-0.5" />
                      </div>
                    ))
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div 
                  className="cursor-pointer flex items-center gap-1 text-gray-600 hover:text-gray-900"
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <MessageSquare className="w-4 h-4" />
                  {commentCounts?.[task.id] && (
                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {commentCounts[task.id]}
                    </span>
                  )}
                </div>
              </TableCell>
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
