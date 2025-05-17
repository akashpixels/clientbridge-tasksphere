
import React from 'react';
import { getStatusColor } from '../../utils/taskFormatters';

interface TaskStatusBadgeProps {
  status: {
    name: string | null;
    color_hex: string | null;
  } | null;
  is_awaiting_input?: boolean;
  is_onhold?: boolean;
  priority_level_id?: number;
  queue_position?: number;
  completed_at?: string | null;
  logged_duration?: any;
  actual_duration?: any;
  est_start?: string | null;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({
  status,
  is_awaiting_input,
  is_onhold,
  priority_level_id,
  queue_position,
  completed_at,
  logged_duration,
  actual_duration,
  est_start
}) => {
  const statusColor = getStatusColor(status || {
    name: null,
    color_hex: null
  }, is_awaiting_input, is_onhold, priority_level_id);
  
  const { formatInterval } = require('../../utils/taskFormatters');
  const { format } = require('date-fns');

  return (
    <div className="flex flex-col items-start gap-1">
      <span 
        className="px-2 py-1 text-xs rounded-full font-semibold inline-block" 
        style={{
          backgroundColor: statusColor.bg,
          color: statusColor.text
        }}
      >
        {is_awaiting_input ? 'Awaiting Input' : 
         is_onhold && priority_level_id === 1 ? 'Urgent' :
         is_onhold ? 'Onhold' :
         priority_level_id === 1 ? 'Urgent' :
         status?.name}
      </span>
      {queue_position && (
        <span className="text-xs text-gray-500 pl-2">
          #{queue_position}
        </span>
      )}
      {completed_at && (
        <span className="text-xs text-gray-500 pl-2">
          {logged_duration ? formatInterval(logged_duration) : actual_duration ? formatInterval(actual_duration) : '0h'}
        </span>
      )}
      {status?.name === 'Open' && est_start && (
        <span className="text-xs text-gray-500 pl-2">
          {format(new Date(est_start), "h:mmaaa d MMM")}
        </span>
      )}
    </div>
  );
};

export default TaskStatusBadge;
