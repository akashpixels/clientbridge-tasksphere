
import React from 'react';

interface TaskPriorityCellProps {
  priority: {
    name: string;
    color: string;
  } | null;
}

export const TaskPriorityCell = ({ priority }: TaskPriorityCellProps) => {
  const getPriorityColor = (priority: { name: string, color: string } | null) => {
    if (!priority) return '#9CA3AF';

    const priorityColors: { [key: string]: string } = {
      'Very Low': '#6EE7B7',
      'Low': '#22C55E',
      'Normal': '#FBBF24',
      'Medium': '#F97316',
      'High': '#EF4444',
      'Critical': '#B91C1C'
    };

    return priorityColors[priority.name] || priority.color || '#9CA3AF';
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: getPriorityColor(priority) }}
      />
      <span className="text-xs text-gray-700">
        {priority?.name || 'Not set'}
      </span>
    </div>
  );
};
