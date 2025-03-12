
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimelineTime, formatHourDifference, formatBaseTime } from "@/lib/date-utils";
import { supabase } from "@/integrations/supabase/client";

interface StartEtaPredictorProps {
  taskTypeId?: number | null;
  priorityLevelId?: number | null;
  complexityLevelId?: number | null;
  projectId?: string;
  compact?: boolean;
  activeTaskCount?: number | null;
}

interface TimelineEstimate {
  currentTime: string;
  startTime: string | null;
  eta: string | null;
  taskInfo: {
    hoursNeeded: number | null;
    timeToStart: number | null;
  };
}

export const StartEtaPredictor = ({
  taskTypeId,
  priorityLevelId = 2,
  complexityLevelId = 3,
  projectId,
  compact = false,
  activeTaskCount = null
}: StartEtaPredictorProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [timelineEstimate, setTimelineEstimate] = useState<TimelineEstimate>({
    currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    startTime: null,
    eta: null,
    taskInfo: {
      hoursNeeded: null,
      timeToStart: null
    }
  });

  useEffect(() => {
    if (!projectId || !taskTypeId || !priorityLevelId) {
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
        
        // Get time to start from priority level
        const { data: priorityData, error: priorityError } = await supabase
          .from('priority_levels')
          .select('time_to_start, multiplier')
          .eq('id', priorityLevelId)
          .maybeSingle();
          
        if (priorityError) {
          console.error('Error fetching priority level:', priorityError);
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
        
        // Calculate hours needed for task
        const timeToStartHours = priorityData?.time_to_start ? 
          parseInterval(priorityData.time_to_start as string) : 0;
          
        const baseDurationHours = taskTypeData?.base_duration ? 
          parseInterval(taskTypeData.base_duration as string) : 2;
          
        const priorityMultiplier = priorityData?.multiplier || 1;
        const complexityMultiplier = complexityData?.multiplier || 1;
        
        // Calculate total hours needed for task
        const hoursNeeded = (baseDurationHours * priorityMultiplier * complexityMultiplier);
        
        // Calculate when task can start based on project timeline
        const baseTime = projectTimeline ? new Date(projectTimeline.base_time as string) : new Date();
        const gapHours = projectTimeline?.gap_time || 0;
        const activeCount = projectTimeline?.active_task_count || 0;
        const maxConcurrent = projectTimeline?.max_concurrent_tasks || 1;
        
        // If project is at capacity, add delay based on earliest ETA
        const mustWait = activeCount >= maxConcurrent;
        const timeToStart = mustWait ? gapHours + timeToStartHours : timeToStartHours;
                
        // Calculate the final start time and ETA
        const startTime = new Date(baseTime);
        if (timeToStart > 0) {
          startTime.setHours(startTime.getHours() + timeToStart);
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
            hoursNeeded,
            timeToStart
          }
        });
        
      } catch (err) {
        console.error('Error calculating timeline:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimelineData();
  }, [projectId, taskTypeId, priorityLevelId, complexityLevelId]);

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const getTimeBetweenNodes = (nodeType: 'start' | 'eta') => {
    if (nodeType === 'start') {
      if (!timelineEstimate?.taskInfo.timeToStart) return "";
      return `${formatHourDifference(timelineEstimate.taskInfo.timeToStart)}`;
    } else {
      if (!timelineEstimate?.taskInfo.hoursNeeded) return "";
      return formatHourDifference(timelineEstimate.taskInfo.hoursNeeded);
    }
  };

  const formatTimeWithLineBreak = (timeString: string | null): React.ReactNode => {
    if (!timeString) return "";
    const parts = timeString.split(', ');
    if (parts.length !== 2) return timeString;
    return (
      <>
        {parts[0]}<br />{parts[1]}
      </>
    );
  };

  return (
    <div className="sticky top-0 bg-background z-10">
      <div className="pt-7 pb-0">
        <div className="relative">
          <div className="absolute top-[-8px] left-[15%] -translate-x-1/2 text-[9px] text-gray-400 font-medium">
            {getTimeBetweenNodes('start')}
          </div>
          
          <div className="absolute top-[-8px] left-[60%] -translate-x-1/2 text-[9px] text-gray-400 font-medium">
            {getTimeBetweenNodes('eta')}
          </div>
          
          <div className="flex justify-between items-center mb-2 pt-1 pb-1 relative min-h-[32px]">
            <div className="absolute top-[16px] left-0 right-0 h-[1px] bg-gray-300 z-0"></div>
            
            <div className="flex flex-col items-start z-10 pl-0">
              <div className="relative h-[20px] flex items-center">
                <div className="w-[1px] h-[13px] bg-gray-300 absolute left-0 top-[-8px]"></div>
              </div>
            </div>
            
            <div className="absolute left-[35%] -translate-x-1/2 z-10 flex flex-col items-center">
              <div className="h-[22px] w-[40px] rounded-full border border-gray-200 bg-white flex items-center justify-center text-[10px] font-medium text-gray-600">
                Start
              </div>
              <div className="text-[9px] mt-0.5 text-gray-500 text-center min-h-[24px]">
                {formatTimeWithLineBreak(formatBaseTime(timelineEstimate?.startTime))}
              </div>
            </div>
            
            <div className="flex flex-col items-end z-10 pr-0">
              <div className="relative h-[20px] flex items-center">
                <div className="h-[22px] w-[35px] rounded-full border border-gray-200 bg-white flex items-center justify-center text-[10px] font-medium text-gray-600 absolute right-0">
                  ETA
                </div>
              </div>
              <div className="text-[9px] mt-0.5 text-gray-500 text-right min-h-[24px]">
                {formatTimeWithLineBreak(formatBaseTime(timelineEstimate?.eta))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
