
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

interface TaskScheduleParams {
  projectId: string;
  priorityLevelId: number;
  taskTypeId: number;
  complexityLevelId: number;
}

interface TaskScheduleResult {
  est_start: string;
  est_end: string;
  initial_status_id: number;
  calculated_est_duration: string;
}

export function useTaskSchedule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<TaskScheduleResult | null>(null);

  const getTaskSchedule = async ({ 
    projectId, 
    priorityLevelId, 
    taskTypeId, 
    complexityLevelId 
  }: TaskScheduleParams) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_task_schedule', {
        p_project_id: projectId,
        p_priority_level_id: priorityLevelId,
        p_task_type_id: taskTypeId,
        p_complexity_level_id: complexityLevelId
      });

      if (error) {
        console.error('Error fetching task schedule:', error);
        setError(error.message);
        return null;
      }

      if (data && data.length > 0) {
        setScheduleData(data[0]);
        return data[0];
      }

      return null;
    } catch (err) {
      console.error('Unexpected error in getTaskSchedule:', err);
      setError('Unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const formatScheduleDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatDuration = (durationString?: string) => {
    if (!durationString) return 'Not available';
    
    // Try to handle PostgreSQL interval format like "2 hours 30 mins"
    try {
      if (durationString.includes('hour')) {
        const hoursMatch = durationString.match(/(\d+)\s+hours?/);
        const minutesMatch = durationString.match(/(\d+)\s+mins?/);
        
        const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
        
        if (minutes > 0) {
          return `${hours}h ${minutes}m`;
        }
        return `${hours}h`;
      }
      
      // If it's a simpler format
      if (durationString.includes(':')) {
        const [hours, minutes] = durationString.split(':');
        if (parseInt(minutes, 10) > 0) {
          return `${parseInt(hours, 10)}h ${parseInt(minutes, 10)}m`;
        }
        return `${parseInt(hours, 10)}h`;
      }
      
      return durationString;
    } catch (error) {
      console.error('Error formatting duration:', error);
      return durationString;
    }
  };

  return {
    getTaskSchedule,
    formatScheduleDate,
    formatDuration,
    loading,
    error,
    scheduleData
  };
}
