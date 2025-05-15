
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TasksTableProps {
  tasks: (Tables<"tasks"> & {
    task_type: {
      name: string;
      category: string;
    } | null;
    status: {
      name: string;
      color_hex: string | null;
      type?: string;
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
    task_attachments?: {
      url: string;
    }[];
    actual_duration?: number | null;
    logged_duration?: number | null;
  })[];
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc';
  };
  onSort: (key: string) => void;
  onImageClick: (image: string, images: string[]) => void;
  onCommentClick: (taskId: string) => void;
  selectedTaskId?: string;
}

const TasksTable = ({
  tasks,
  sortConfig,
  onSort,
  onImageClick,
  onCommentClick,
  selectedTaskId
}: TasksTableProps) => {
  // Helper function to extract status type info
  const getStatusTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to format duration (in hours)
  const formatDuration = (hours: number | null | undefined) => {
    if (hours === null || hours === undefined) return '—';
    return `${hours.toFixed(1)}h`;
  };
  
  // Helper function to render task status indicator
  const renderStatusIndicator = (task: any) => {
    if (task.is_awaiting_input) {
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
          <Clock size={12} /> Awaiting Input
        </Badge>
      );
    } else if (task.is_onhold) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 gap-1">
          <AlertCircle size={12} /> On Hold
        </Badge>
      );
    } else if (task.status?.type?.toLowerCase() === 'completed') {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 gap-1">
          <CheckCircle size={12} /> Complete
        </Badge>
      );
    }
    return null;
  };

  // Get all images from all tasks for the image viewer
  const getAllTaskImages = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.task_attachments) return [];
    return task.task_attachments.map(attachment => attachment.url);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px]">
            <Button 
              variant="ghost" 
              size="sm"
              className="p-0 font-medium"
              onClick={() => onSort('title')}
            >
              Task
              {sortConfig.key === 'title' && (
                <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </Button>
          </TableHead>
          <TableHead className="w-[120px]">Type</TableHead>
          <TableHead className="w-[120px]">
            <Button 
              variant="ghost" 
              size="sm"
              className="p-0 font-medium"
              onClick={() => onSort('priority_level_id')}
            >
              Priority
              {sortConfig.key === 'priority_level_id' && (
                <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </Button>
          </TableHead>
          <TableHead className="w-[120px]">Status</TableHead>
          <TableHead className="w-[100px]">
            <Button 
              variant="ghost" 
              size="sm"
              className="p-0 font-medium"
              onClick={() => onSort('est_start')}
            >
              Date
              {sortConfig.key === 'est_start' && (
                <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </Button>
          </TableHead>
          <TableHead className="w-[100px]">
            <Button 
              variant="ghost" 
              size="sm"
              className="p-0 font-medium"
              onClick={() => onSort('actual_duration')}
            >
              Hours
              {sortConfig.key === 'actual_duration' && (
                <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </Button>
          </TableHead>
          <TableHead className="w-[120px]">Assigned</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map(task => (
          <TableRow 
            key={task.id}
            className={`cursor-pointer ${selectedTaskId === task.id ? 'bg-gray-50' : ''}`}
            onClick={() => onCommentClick(task.id)}
          >
            <TableCell className="font-medium">
              <div className="flex flex-col">
                <div className="font-medium">
                  {task.task_code && <span className="text-xs font-mono mr-1 text-gray-500">{task.task_code}</span>}
                  {task.title}
                </div>
                {task.task_attachments && task.task_attachments.length > 0 && (
                  <div className="flex flex-wrap mt-1 gap-1">
                    {task.task_attachments.slice(0, 3).map((attachment, index) => (
                      <div 
                        key={index}
                        className="w-8 h-8 rounded bg-gray-200 overflow-hidden cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageClick(attachment.url, getAllTaskImages(task.id));
                        }}
                      >
                        <img 
                          src={attachment.url} 
                          alt="Attachment" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Handle image loading error
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                    {task.task_attachments.length > 3 && (
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                        +{task.task_attachments.length - 3}
                      </div>
                    )}
                  </div>
                )}
                {renderStatusIndicator(task)}
              </div>
            </TableCell>
            <TableCell>{task.task_type?.name || '—'}</TableCell>
            <TableCell>
              {task.priority && (
                <span 
                  className="inline-block px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: `${task.priority.color_hex}15`,
                    color: task.priority.color_hex
                  }}
                >
                  {task.priority.name}
                </span>
              )}
            </TableCell>
            <TableCell>
              {task.status && (
                <span 
                  className="inline-block px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: `${task.status.color_hex}15`,
                    color: task.status.color_hex
                  }}
                >
                  {task.status.name}
                </span>
              )}
            </TableCell>
            <TableCell>
              {task.est_start && format(new Date(task.est_start), 'MMM d')}
            </TableCell>
            <TableCell>{formatDuration(task.actual_duration)}</TableCell>
            <TableCell>
              {task.assigned_user ? (
                `${task.assigned_user.first_name} ${task.assigned_user.last_name}`
              ) : (
                <span className="text-gray-400">Unassigned</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TasksTable;
