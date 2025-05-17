
import { useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { toast } from "@/hooks/use-toast";

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
  
  // Use refs to track the last request parameters to avoid duplicate calls
  const lastRequestRef = useRef<string | null>(null);

  const getTaskSchedule = useCallback(async ({ 
    projectId, 
    priorityLevelId, 
    taskTypeId, 
    complexityLevelId 
  }: TaskScheduleParams, forceUpdate = false) => {
    try {
      // Create a request signature to compare with previous requests
      const requestSignature = `${projectId}-${priorityLevelId}-${taskTypeId}-${complexityLevelId}`;
      
      // Skip if this is the same request as the last one and we're not forcing an update
      if (!forceUpdate && requestSignature === lastRequestRef.current) {
        console.log("Skipping duplicate task schedule request");
        return scheduleData;
      }
      
      // Update last request signature
      lastRequestRef.current = requestSignature;
      
      setLoading(true);
      setError(null);

      console.log("Calling get_task_schedule with params:", {
        projectId,
        priorityLevelId,
        taskTypeId,
        complexityLevelId
      });

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

      console.log("Received schedule data:", data);
      
      if (data && data.length > 0) {
        // Ensure calculated_est_duration is a string
        const result: TaskScheduleResult = {
          ...data[0],
          calculated_est_duration: String(data[0].calculated_est_duration)
        };
        
        console.log("Processed schedule result:", result);
        
        // Validate that we have an initial_status_id
        if (!result.initial_status_id) {
          console.error("Missing initial_status_id in schedule result:", result);
          setError("Could not determine task status. Please try again.");
          return null;
        }
        
        setScheduleData(result);
        return result;
      }

      console.error("Empty or invalid schedule data returned:", data);
      setError("Invalid schedule data received");
      return null;
    } catch (err) {
      console.error('Unexpected error in getTaskSchedule:', err);
      setError('Unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [scheduleData]);

  const formatScheduleDate = useCallback((dateString?: string) => {
    if (!dateString) return 'Not available';
    
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }, []);

  const formatDuration = useCallback((durationString?: string) => {
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
        const parts = durationString.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;
        
        if (minutes > 0) {
          return `${hours}h ${minutes}m`;
        }
        return `${hours}h`;
      }
      
      return durationString;
    } catch (error) {
      console.error('Error formatting duration:', error);
      return durationString;
    }
  }, []);

  return {
    getTaskSchedule,
    formatScheduleDate,
    formatDuration,
    loading,
    error,
    scheduleData,
    setScheduleData,
  };
}
