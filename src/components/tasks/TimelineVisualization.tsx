
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addHours, addDays, addMinutes, differenceInHours } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimelineTime, formatHourDifference } from "@/lib/date-utils";

interface TimelineVisualizationProps {
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
    isOverdue: boolean;
  };
}

export const TimelineVisualization = ({
  taskTypeId,
  priorityLevelId,
  complexityLevelId = 3,
  projectId,
  compact = false,
  activeTaskCount = null
}: TimelineVisualizationProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [taskType, setTaskType] = useState<any>(null);
  const [priorityLevel, setPriorityLevel] = useState<any>(null);
  const [complexityLevel, setComplexityLevel] = useState<any>(null);
  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState(1);
  const [timelineEstimate, setTimelineEstimate] = useState<TimelineEstimate | null>(null);

  // Fetch task type data
  useEffect(() => {
    const fetchTaskType = async () => {
      if (!taskTypeId) return;
      const { data, error } = await supabase
        .from('task_types')
        .select('*')
        .eq('id', taskTypeId)
        .single();
        
      if (error) {
        console.error("Error fetching task type:", error);
        return;
      }
      setTaskType(data);
    };
    
    if (taskTypeId) {
      fetchTaskType();
    } else {
      setTaskType(null);
    }
  }, [taskTypeId]);

  // Fetch priority level data
  useEffect(() => {
    const fetchPriorityLevel = async () => {
      if (!priorityLevelId) return;
      const { data, error } = await supabase
        .from('priority_levels')
        .select('*')
        .eq('id', priorityLevelId)
        .single();
        
      if (error) {
        console.error("Error fetching priority level:", error);
        return;
      }
      setPriorityLevel(data);
    };
    
    if (priorityLevelId) {
      fetchPriorityLevel();
    } else {
      setPriorityLevel(null);
    }
  }, [priorityLevelId]);

  // Fetch complexity level data
  useEffect(() => {
    const fetchComplexityLevel = async () => {
      if (!complexityLevelId) return;
      const { data, error } = await supabase
        .from('complexity_levels')
        .select('*')
        .eq('id', complexityLevelId)
        .single();
        
      if (error) {
        console.error("Error fetching complexity level:", error);
        return;
      }
      setComplexityLevel(data);
    };
    
    if (complexityLevelId) {
      fetchComplexityLevel();
    } else {
      setComplexityLevel(null);
    }
  }, [complexityLevelId]);

  // Fetch project concurrency data
  useEffect(() => {
    const fetchProjectConcurrency = async () => {
      if (!projectId) return;
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('max_concurrent_tasks')
          .eq('id', projectId)
          .single();
          
        if (error) throw error;
        if (data && data.max_concurrent_tasks) {
          setMaxConcurrentTasks(data.max_concurrent_tasks);
        }
      } catch (err: any) {
        console.error("Error fetching project concurrency:", err);
      }
    };
    
    if (projectId) {
      fetchProjectConcurrency();
    }
  }, [projectId]);

  // Calculate timeline estimate without server functions
  useEffect(() => {
    const calculateTimelineEstimate = async () => {
      try {
        setIsLoading(true);
        const now = new Date();
        let startTime: Date | null = null;
        let eta: Date | null = null;
        let hoursNeeded: number | null = null;
        let timeToStart: number | null = null;
        let isOverdue = false;
        
        if (taskType && priorityLevel && complexityLevel) {
          // Start with current time
          startTime = new Date();
          
          // Extract time to start from priority level
          if (priorityLevel.time_to_start) {
            const timeToStartMatch = priorityLevel.time_to_start.match(/(\d+):(\d+):(\d+)/);
            if (timeToStartMatch) {
              const hours = parseInt(timeToStartMatch[1]);
              const minutes = parseInt(timeToStartMatch[2]);
              timeToStart = hours + minutes / 60;
              
              // Apply priority delay
              if (activeTaskCount === 0) {
                // No active tasks, just add the time_to_start
                startTime = addHours(startTime, hours);
                startTime = addMinutes(startTime, minutes);
              } else {
                // There are active tasks, add a standard delay
                startTime = addHours(startTime, Math.max(1, hours));
              }
            }
          }
          
          // Apply task count delay if needed
          if (activeTaskCount !== null && activeTaskCount > maxConcurrentTasks) {
            const queueDelay = (activeTaskCount - maxConcurrentTasks) * 30; // 30 min per position
            startTime = addMinutes(startTime, queueDelay);
          }
          
          // Adjust for working hours (10am - 6pm)
          const currentHour = startTime.getHours();
          if (currentHour < 10) {
            // Before working hours, move to 10am
            startTime.setHours(10, 0, 0, 0);
          } else if (currentHour >= 18) {
            // After working hours, move to next day 10am
            startTime = addDays(startTime, 1);
            startTime.setHours(10, 0, 0, 0);
          }
          
          // Calculate hours needed
          hoursNeeded = 0;
          
          // Add base duration if available
          if (taskType.base_duration) {
            const baseDurationMatch = taskType.base_duration.match(/(\d+):(\d+):(\d+)/);
            if (baseDurationMatch) {
              const hours = parseInt(baseDurationMatch[1]);
              const minutes = parseInt(baseDurationMatch[2]);
              const baseDuration = hours + minutes / 60;
              
              // Apply complexity multiplier
              if (complexityLevel.multiplier) {
                hoursNeeded = baseDuration * complexityLevel.multiplier;
              } else {
                hoursNeeded = baseDuration;
              }
            }
          }
          
          // Calculate ETA based on start time and hours needed
          if (startTime && hoursNeeded) {
            eta = new Date(startTime);
            eta = addHours(eta, hoursNeeded);
            
            // Adjust ETA for working hours
            const etaHour = eta.getHours();
            const workingHoursInDay = 8; // 10am to 6pm
            
            if (etaHour >= 18) {
              const hoursOver = etaHour - 18;
              const daysToAdd = Math.floor(hoursOver / workingHoursInDay) + 1;
              const remainingHours = hoursOver % workingHoursInDay;
              
              eta = addDays(eta, daysToAdd);
              eta.setHours(10 + remainingHours, eta.getMinutes(), 0, 0);
            }
            
            // Check if task might be overdue (for high priority tasks with long ETAs)
            isOverdue = priorityLevel.id >= 4 && differenceInHours(eta, now) > 48;
          }
        }
        
        setTimelineEstimate({
          currentTime: format(now, 'h:mm a'),
          startTime: startTime ? format(startTime, 'h:mm a, MMM d') : null,
          eta: eta ? format(eta, 'h:mm a, MMM d') : null,
          taskInfo: {
            hoursNeeded: hoursNeeded ? Math.round(hoursNeeded * 10) / 10 : null,
            timeToStart: timeToStart,
            isOverdue
          }
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error calculating timeline:", error);
        const now = new Date();
        
        setTimelineEstimate({
          currentTime: format(now, 'h:mm a'),
          startTime: null,
          eta: null,
          taskInfo: {
            hoursNeeded: null,
            timeToStart: null,
            isOverdue: false
          }
        });
        
        setIsLoading(false);
      }
    };
    
    calculateTimelineEstimate();
  }, [taskType, priorityLevel, complexityLevel, activeTaskCount, maxConcurrentTasks, projectId]);

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

        {timelineEstimate?.taskInfo.isOverdue && (
          <div className="flex items-start text-yellow-600 text-xs p-2 bg-yellow-50 rounded-md border border-yellow-200 mt-1">
            <AlertTriangle size={14} className="mt-0.5 mr-1 flex-shrink-0" />
            <span>
              This task may take longer than expected. Consider adjusting priority or complexity.
            </span>
          </div>
        )}
          
        {activeTaskCount !== null && activeTaskCount > maxConcurrentTasks && (
          <div className="flex items-center text-blue-600 text-xs p-2 bg-blue-50 rounded-md border border-blue-200 mt-2">
            <span>
              Active tasks: {activeTaskCount} (adds {(activeTaskCount - maxConcurrentTasks) * 30} min delay)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
