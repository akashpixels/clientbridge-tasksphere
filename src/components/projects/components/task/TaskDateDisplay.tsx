
import React from 'react';
import { format } from 'date-fns';

interface TaskDateDisplayProps {
  date: string | null | undefined;
  label?: string;
}

export const TaskDateDisplay: React.FC<TaskDateDisplayProps> = ({ date, label = "Date" }) => {
  if (!date) {
    return <span className="text-xs text-gray-700">Not set</span>;
  }
  
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-600">{format(new Date(date), "h:mm a")}</span>
      <span className="text-xs text-gray-700">{format(new Date(date), "MMM d")}</span>
    </div>
  );
};

export default TaskDateDisplay;
