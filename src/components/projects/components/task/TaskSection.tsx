
import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import TaskRow from "./TaskRow";
import { getGroupLabel } from "../../utils/taskFormatters";
import { TaskSectionProps } from "../../types/taskTypes";

export const TaskSection: React.FC<TaskSectionProps> = ({ 
  title, 
  taskList, 
  onCommentClick, 
  onImageClick,
  selectedTaskId 
}) => {
  if (taskList.length === 0) return null;
  
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 px-[6px]">
        {getGroupLabel(title)}
      </h3>
      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableBody>
            {taskList.map(task => (
              <TaskRow 
                key={task.id}
                task={task} 
                onCommentClick={onCommentClick}
                onImageClick={onImageClick}
                isSelected={selectedTaskId === task.id}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TaskSection;
