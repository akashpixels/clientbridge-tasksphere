
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimelineTime, formatHourDifference, calculateWorkingHours, formatWorkingHours } from "@/lib/date-utils";
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
    workingHours: number | null;
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
      workingHours: null
    }
  });

  useEffect(() => {
    if (!projectId || !taskTypeId) {
      setIsLoading(false);
      return;
    }

    const fetchTimelineData = async () => {
      try {
        setIsLoading(true);
        
        // Get complexity multiplier from complexity level
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
        
        // Get base duration from task type
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
        
        // Calculate hours needed for the task (simplified)
        const baseDurationHours = taskTypeData?.base_duration ? 
          parseInterval(taskTypeData.base_duration as string) : 2;
        const complexityMultiplier = complexityData?.multiplier || 1;
        const hoursNeeded = baseDurationHours * complexityMultiplier;
        
        // Use the task_timeline view to get start and eta values
        const { data: timelineData, error: timelineError } = await supabase
          .from('task_timeline')
          .select('*')
          .eq('project_id', projectId)
          .eq('priority_level_id', priorityLevelId)
          .maybeSingle();
          
        if (timelineError) {
          console.error('Error fetching timeline data:', timelineError);
          
          // Fallback to just using the project_timeline base
          const { data: projectTimeline, error: projectTimelineError } = await supabase
            .from('project_timeline')
            .select('base_time, gap_time')
            .eq('project_id', projectId)
            .maybeSingle();
            
          if (projectTimelineError) {
            console.error('Error fetching project timeline:', projectTimelineError);
            setIsLoading(false);
            return;
          }
          
          // Calculate a simplistic start and eta
          const baseTime = projectTimeline?.base_time ? new Date(projectTimeline.base_time) : new Date();
          const gapHours = projectTimeline?.gap_time || 0;
          
          // Simple calculation (not using working hours)
          const startTime = new Date(baseTime);
          startTime.setHours(startTime.getHours() + gapHours);
          
          const etaTime = new Date(startTime);
          etaTime.setHours(etaTime.getHours() + hoursNeeded);
          
          // Calculate approximate working hours between timestamps
          let workingHours = 0;
          if (startTime && etaTime) {
            workingHours = await calculateWorkingHours(startTime.toISOString(), etaTime.toISOString());
          }
          
          setTimelineEstimate({
            currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            startTime: startTime.toISOString(),
            eta: etaTime.toISOString(),
            taskInfo: {
              hoursNeeded: hoursNeeded,
              workingHours: workingHours
            }
          });
          
          setIsLoading(false);
          return;
        }
        
        // If we have timeline data from our view
        if (timelineData) {
          const startTime = timelineData.start_time;
          const eta = timelineData.eta;
          
          // Calculate working hours between start and eta
          let workingHours = 0;
          if (startTime && eta) {
            workingHours = await calculateWorkingHours(startTime, eta);
          }
          
          setTimelineEstimate({
            currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            startTime: startTime,
            eta: eta,
            taskInfo: {
              hoursNeeded: hoursNeeded,
              workingHours: workingHours
            }
          });
        } else {
          // No timeline data - use default calculation
          const baseTime = new Date();
          const startTime = new Date(baseTime);
          startTime.setHours(startTime.getHours() + 1); // Default gap
          
          const etaTime = new Date(startTime);
          etaTime.setHours(etaTime.getHours() + hoursNeeded);
          
          setTimelineEstimate({
            currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            startTime: startTime.toISOString(),
            eta: etaTime.toISOString(),
            taskInfo: {
              hoursNeeded: hoursNeeded,
              workingHours: null
            }
          });
        }
      } catch (err) {
        console.error('Error calculating timeline:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimelineData();
  }, [projectId, taskTypeId, complexityLevelId, priorityLevelId]);

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

  const getTimeBetweenNodes = () => {
    // Return working hours if available, otherwise fallback to regular hours
    if (timelineEstimate?.taskInfo.workingHours) {
      return formatWorkingHours(timelineEstimate.taskInfo.workingHours);
    }
    
    // Fallback to regular hours display
    if (!timelineEstimate?.taskInfo.hoursNeeded) return "";
    return formatHourDifference(timelineEstimate.taskInfo.hoursNeeded);
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
          <div className="absolute top-[-8px] left-[60%] -translate-x-1/2 text-[9px] text-gray-400 font-medium">
            {getTimeBetweenNodes()}
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
                {formatTimeWithLineBreak(formatTimelineTime(timelineEstimate?.startTime))}
              </div>
            </div>
            
            <div className="flex flex-col items-end z-10 pr-0">
              <div className="relative h-[20px] flex items-center">
                <div className="h-[22px] w-[35px] rounded-full border border-gray-200 bg-white flex items-center justify-center text-[10px] font-medium text-gray-600 absolute right-0">
                  ETA
                </div>
              </div>
              <div className="text-[9px] mt-0.5 text-gray-500 text-right min-h-[24px]">
                {formatTimeWithLineBreak(formatTimelineTime(timelineEstimate?.eta))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
