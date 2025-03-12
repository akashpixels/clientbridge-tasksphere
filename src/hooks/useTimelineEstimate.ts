
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TimelineEstimate {
  currentTime: string;
  startTime: string | null;
  eta: string | null;
  taskInfo: {
    hoursNeeded: number | null;
  };
}

interface UseTimelineEstimateProps {
  taskTypeId?: number | null;
  complexityLevelId?: number | null;
  priorityLevelId?: number | null;
  projectId?: string;
  activeTaskCount?: number | null;
}

export const useTimelineEstimate = ({
  taskTypeId,
  complexityLevelId = 3,
  priorityLevelId = 2,
  projectId,
  activeTaskCount = null
}: UseTimelineEstimateProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [timelineEstimate, setTimelineEstimate] = useState<TimelineEstimate>({
    currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    startTime: null,
    eta: null,
    taskInfo: {
      hoursNeeded: null
    }
  });

  // Helper function to parse PostgreSQL interval to hours
  const parseInterval = (interval: string): number => {
    // Handle simple interval like '2 hours'
    const hoursMatch = interval.match(/(\d+)\s+hours?/i);
    if (hoursMatch) return parseInt(hoursMatch[1], 10);
    
    // Handle complex intervals like '01:30:00' (hh:mm:ss)
    const timeMatch = interval.match(/(\d+):(\d+):(\d+)/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      return hours + (minutes / 60);
    }
    
    // Handle days
    const daysMatch = interval.match(/(\d+)\s+days?/i);
    if (daysMatch) return parseInt(daysMatch[1], 10) * 24;
    
    // Return default if format not recognized
    return 0;
  };

  useEffect(() => {
    if (!projectId || !taskTypeId) {
      setIsLoading(false);
      return;
    }

    const fetchTimelineData = async () => {
      try {
        setIsLoading(true);
        
        // First, get project timeline info
        const { data: projectTimeline, error: timelineError } = await supabase
          .from('project_timeline')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle();
          
        if (timelineError) {
          console.error('Error fetching project timeline:', timelineError);
          setIsLoading(false);
          return;
        }
        
        // Get task duration base from task type
        const { data: taskTypeData, error: taskTypeError } = await supabase
          .from('task_types')
          .select('base_duration')
          .eq('id', taskTypeId)
          .maybeSingle();
          
        if (taskTypeError) {
          console.error('Error fetching task type:', taskTypeError);
          setIsLoading(false);
          return;
        }
        
        // Get complexity multiplier
        const { data: complexityData, error: complexityError } = await supabase
          .from('complexity_levels')
          .select('multiplier')
          .eq('id', complexityLevelId || 3)
          .maybeSingle();
          
        if (complexityError) {
          console.error('Error fetching complexity level:', complexityError);
          setIsLoading(false);
          return;
        }
        
        // Calculate hours needed for task - simplified calculation
        const baseDurationHours = taskTypeData?.base_duration ? 
          parseInterval(taskTypeData.base_duration as string) : 2;
          
        const complexityMultiplier = complexityData?.multiplier || 1;
        
        // Calculate total hours needed for task using simplified formula
        const hoursNeeded = baseDurationHours * complexityMultiplier;
        
        // Calculate when task can start based on project timeline
        const baseTime = projectTimeline ? new Date(projectTimeline.base_time as string) : new Date();
        const gapHours = projectTimeline?.gap_time || 0;
        const activeCount = projectTimeline?.active_task_count || 0;
        const maxConcurrent = projectTimeline?.max_concurrent_tasks || 1;
        
        // If project is at capacity, add delay based on earliest ETA
        const mustWait = activeCount >= maxConcurrent;
        
        // Calculate the final start time and ETA
        const startTime = new Date(baseTime);
        if (mustWait && gapHours > 0) {
          startTime.setHours(startTime.getHours() + gapHours);
        }
        
        const etaTime = new Date(startTime);
        etaTime.setHours(etaTime.getHours() + hoursNeeded);
        
        // Format the timestamps as locale string
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Update the timeline estimate state
        setTimelineEstimate({
          currentTime,
          startTime: startTime.toISOString(),
          eta: etaTime.toISOString(),
          taskInfo: {
            hoursNeeded
          }
        });
        
      } catch (err) {
        console.error('Error calculating timeline:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimelineData();
  }, [projectId, taskTypeId, complexityLevelId]);

  return { isLoading, timelineEstimate };
};
