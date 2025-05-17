
import { format } from "date-fns";

/**
 * Formats an interval value (duration) into a readable hours format
 */
export const formatInterval = (intervalValue: any): string => {
  if (!intervalValue) return "0h";
  if (typeof intervalValue === 'number') {
    return intervalValue === 0 ? "0h" : `${intervalValue}h`;
  }
  try {
    if (typeof intervalValue === 'string') {
      if (intervalValue.includes(':')) {
        const parts = intervalValue.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const minutesAsHours = minutes / 60;
        return `${(hours + minutesAsHours).toFixed(1).replace(/\.0$/, '')}h`;
      } else if (intervalValue.includes('hours') || intervalValue.includes('hour')) {
        const hoursMatch = intervalValue.match(/(\d+)\s+hours?/);
        const minutesMatch = intervalValue.match(/(\d+)\s+minutes?/);
        const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
        const minutesAsHours = minutes / 60;
        return `${(hours + minutesAsHours).toFixed(1).replace(/\.0$/, '')}h`;
      }
      return `${parseFloat(intervalValue)}h`;
    }
    if (typeof intervalValue === 'object' && intervalValue !== null) {
      const stringValue = String(intervalValue);
      return formatInterval(stringValue);
    }
    return "0h";
  } catch (e) {
    console.error("Error formatting interval:", e, intervalValue);
    return "0h";
  }
};

/**
 * Gets the appropriate status color with styling
 */
export const getStatusColor = (
  status: {
    name: string | null;
    color_hex: string | null;
  },
  is_awaiting_input?: boolean,
  is_onhold?: boolean,
  priority_level_id?: number
) => {
  // For awaiting input tasks, we use the awaiting input styling
  if (is_awaiting_input) {
    return {
      bg: '#FEF9C3',
      text: '#854D0E'
    };
  }
  
  // For on hold tasks, we use the on hold styling
  if (is_onhold) {
    return {
      bg: '#FDE68A',
      text: '#92400E'
    };
  }
  
  // For critical tasks (priority_level_id = 1), we use the urgent styling
  if (priority_level_id === 1) {
    return {
      bg: '#fff6ca',
      text: '#834a1e'
    };
  }
  
  if (!status?.color_hex) {
    return {
      bg: '#F3F4F6',
      text: '#374151'
    };
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

/**
 * Gets the visual representation value for complexity (number of bars)
 */
export const getComplexityBars = (complexity: {
  name: string;
  multiplier: number;
} | null): number => {
  if (!complexity) return 1;
  const complexityMap: {
    [key: string]: number;
  } = {
    'Basic': 1,
    'Standard': 2,
    'Advanced': 3,
    'Complex': 4,
    'Very Complex': 5,
    'Extreme': 6
  };
  return complexityMap[complexity.name] || 1;
};

/**
 * Gets a color for a priority level
 */
export const getPriorityColor = (priority: {
  name: string;
  color_hex: string;
} | null): string => {
  if (!priority) return '#9CA3AF';
  const priorityColors: {
    [key: string]: string;
  } = {
    'Very Low': '#6EE7B7',
    'Low': '#22C55E',
    'Normal': '#FBBF24',
    'Medium': '#F97316',
    'High': '#EF4444',
    'Critical': '#B91C1C'
  };
  return priorityColors[priority.name] || priority.color_hex || '#9CA3AF';
};

/**
 * Determines which task group a task belongs to
 */
export const getTaskGroup = (task: any): string => {
  // First check for critical tasks (priority_level_id = 1)
  if (task.priority_level_id === 1) {
    return 'critical';
  }
  
  const statusType = (task.status?.type || '').toLowerCase();
  
  if (statusType === 'active') {
    return 'active';
  }
  if (statusType === 'scheduled') {
    return 'scheduled';
  }
  if (statusType === 'completed') {
    return 'completed';
  }
  return 'special'; // Any other type
};

/**
 * Gets a display label for a task group
 */
export const getGroupLabel = (groupId: string): string => {
  switch (groupId) {
    case 'critical':
      return "Critical Tasks";
    case 'active':
      return "Active Tasks";
    case 'scheduled':
      return "Scheduled Tasks";
    case 'completed':
      return "Completed Tasks";
    case 'special':
      return "Other Tasks";
    default:
      return "Tasks";
  }
};

/**
 * Format a date in a consistent way
 */
export const formatTaskDate = (date: string | null | undefined, format: string): string => {
  if (!date) return "Not set";
  return date ? format(new Date(date), format) : "Not set";
};
