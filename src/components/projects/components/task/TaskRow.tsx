
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLayout } from "@/context/layout";
import TaskStatusBadge from "./TaskStatusBadge";
import TaskPriorityIndicator from "./TaskPriorityIndicator";
import TaskComplexityBar from "./TaskComplexityBar";
import TaskDateDisplay from "./TaskDateDisplay";
import TaskReferenceLinks from "./TaskReferenceLinks";
import TaskImagesPreview from "./TaskImagesPreview";
import TaskDeviceIcon from "./TaskDeviceIcon";
import TaskCommentThread from "../comments/TaskCommentThread";
import { TaskRowProps } from "../../types/taskTypes";

export const TaskRow: React.FC<TaskRowProps> = ({ 
  task, 
  onCommentClick, 
  onImageClick,
  isSelected 
}) => {
  const { setRightSidebarContent } = useLayout();

  const handleRowClick = () => {
    onCommentClick(task.id);
    setRightSidebarContent(
      <TaskCommentThread 
        taskId={task.id} 
        taskCode={typeof task.task_code === 'string' ? task.task_code : String(task.task_code || 'No Code')} 
      />
    );
  };

  return (
    <TableRow 
      key={task.id} 
      className={`cursor-pointer ${isSelected ? 'bg-white' : 'hover:bg-muted/30'}`} 
      onClick={handleRowClick}
    >
      <TableCell className="w-[8%] px-4">
        <Badge variant="outline" className="font-mono text-xs">
          {task.task_code || '—'}
        </Badge>
      </TableCell>
      <TableCell className="w-[10%] px-4">
        <TaskStatusBadge
          status={task.status}
          is_awaiting_input={task.is_awaiting_input}
          is_onhold={task.is_onhold}
          priority_level_id={task.priority_level_id}
          queue_position={task.queue_position}
          completed_at={task.completed_at}
          logged_duration={task.logged_duration}
          actual_duration={task.actual_duration}
          est_start={task.est_start}
        />
      </TableCell>
      <TableCell className="w-[30%] px-4">
        <div className="flex-1 min-w-0 max-w-[350px]">
          <p className="text-sm break-words">{task.details}</p>
          <p className="text-xs text-gray-500 mt-1">{task.task_type?.name}</p>
        </div>
      </TableCell>
      <TableCell className="w-[5%] px-4 text-center">
        <TaskDeviceIcon targetDevice={task.target_device || ''} />
      </TableCell>  
      <TableCell className="w-[7%] px-4">
        <TaskPriorityIndicator priority={task.priority} />
      </TableCell>
      <TableCell className="w-[7%] px-4 text-center">
        <TaskComplexityBar complexity={task.complexity} />
      </TableCell>
      <TableCell className="w-[8%] px-4 text-left">
        <TaskDateDisplay date={task.est_start} />
      </TableCell>
      <TableCell className="w-[8%] px-4 text-left">
        <TaskDateDisplay date={task.est_end} />
      </TableCell>
      <TableCell className="w-[9%] px-4">
        <TaskReferenceLinks links={task.reference_links as Record<string, string>} />
      </TableCell>
      <TableCell className="w-[8%] px-4 text-center">
        <TaskImagesPreview 
          images={task.images as string[] || []} 
          onImageClick={onImageClick}
        />
      </TableCell>
    </TableRow>
  );
};

export default TaskRow;
