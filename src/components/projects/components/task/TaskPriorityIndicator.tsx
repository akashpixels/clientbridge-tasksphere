
import React from 'react';
import { getPriorityColor } from '../../utils/taskFormatters';

interface TaskPriorityIndicatorProps {
  priority: {
    name: string;
    color_hex: string;
  } | null;
}

export const TaskPriorityIndicator: React.FC<TaskPriorityIndicatorProps> = ({ priority }) => {
  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-2 h-2 rounded-full" 
        style={{
          backgroundColor: getPriorityColor(priority)
        }} 
      />
      <span className="text-xs text-gray-700">
        {priority?.name || 'Not set'}
      </span>
    </div>
  );
};

export default TaskPriorityIndicator;
