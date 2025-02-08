
import React from 'react';

interface TaskStatusCellProps {
  status: {
    name: string | null;
    color_hex: string | null;
  } | null;
  completedAt?: string | null;
  hoursSpent?: number | null;
}

export const TaskStatusCell = ({ status, completedAt, hoursSpent }: TaskStatusCellProps) => {
  const getStatusColor = (status: { name: string | null, color_hex: string | null }) => {
    if (!status?.color_hex) {
      return { bg: '#F3F4F6', text: '#374151' };
    }

    const [bgColor, textColor] = status.color_hex.split(',').map(color => color.trim());
    
    if (bgColor && textColor) {
      return {
        bg: bgColor,
        text: textColor
      };
    }
    
    const hex = status.color_hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const max = Math.max(r, g, b);
    
    const saturationMultiplier = 1.3;
    const darkenFactor = 0.8;
    
    const newR = r === max ? Math.min(255, r * saturationMultiplier * darkenFactor) : r * darkenFactor;
    const newG = g === max ? Math.min(255, g * saturationMultiplier * darkenFactor) : g * darkenFactor;
    const newB = b === max ? Math.min(255, b * saturationMultiplier * darkenFactor) : b * darkenFactor;
    
    const enhancedColor = `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;

    return {
      bg: status.color_hex,
      text: enhancedColor
    };
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <span 
        className="px-2 py-1 text-xs rounded-full font-semibold"
        style={{
          backgroundColor: getStatusColor(status || { name: null, color_hex: null }).bg,
          color: getStatusColor(status || { name: null, color_hex: null }).text
        }}
      >
        {status?.name}
      </span>
      {completedAt && hoursSpent && (
        <span className="text-xs text-gray-500 pl-2">
          {hoursSpent} hrs
        </span>
      )}
    </div>
  );
};
