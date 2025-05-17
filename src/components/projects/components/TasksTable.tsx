
import React from 'react';
import { getTaskGroup } from '../utils/taskFormatters';
import { TasksTableProps, TaskWithRelations } from '../types/taskTypes';
import TaskTableHeader from './task/TaskTableHeader';
import TaskSection from './task/TaskSection';

const TasksTable: React.FC<TasksTableProps> = ({
  tasks,
  sortConfig,
  onSort,
  onImageClick,
  onCommentClick,
  selectedTaskId
}) => {
  // Group tasks by type
  const groupedTasks: Record<string, TaskWithRelations[]> = {
    critical: [],
    active: [],
    scheduled: [],
    completed: [],
    special: []
  };

  // Distribute tasks into their respective groups
  tasks.forEach(task => {
    const group = getTaskGroup(task);
    groupedTasks[group].push(task);
  });

  return (
    <>
      <TaskTableHeader />
      
      {/* Render each task section based on their groups */}
      {groupedTasks.critical.length > 0 && (
        <TaskSection 
          title="critical"
          taskList={groupedTasks.critical}
          onCommentClick={onCommentClick}
          onImageClick={onImageClick}
          selectedTaskId={selectedTaskId}
        />
      )}
      
      {groupedTasks.active.length > 0 && (
        <TaskSection 
          title="active"
          taskList={groupedTasks.active}
          onCommentClick={onCommentClick}
          onImageClick={onImageClick}
          selectedTaskId={selectedTaskId}
        />
      )}
      
      {groupedTasks.scheduled.length > 0 && (
        <TaskSection 
          title="scheduled"
          taskList={groupedTasks.scheduled}
          onCommentClick={onCommentClick}
          onImageClick={onImageClick}
          selectedTaskId={selectedTaskId}
        />
      )}
      
      {groupedTasks.completed.length > 0 && (
        <TaskSection 
          title="completed"
          taskList={groupedTasks.completed}
          onCommentClick={onCommentClick}
          onImageClick={onImageClick}
          selectedTaskId={selectedTaskId}
        />
      )}
      
      {groupedTasks.special.length > 0 && (
        <TaskSection 
          title="special"
          taskList={groupedTasks.special}
          onCommentClick={onCommentClick}
          onImageClick={onImageClick}
          selectedTaskId={selectedTaskId}
        />
      )}
    </>
  );
};

export default TasksTable;
