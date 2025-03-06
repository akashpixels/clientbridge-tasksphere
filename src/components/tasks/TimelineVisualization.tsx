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
  queuePosition?: number | null;
}

interface TimelineEstimate {
  currentTime: string;
  startTime: string | null;
  eta: string | null;
  queuePosition: number | null;
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
  queuePosition = null
}: TimelineVisualizationProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [taskType, setTaskType] = useState<any>(null);
  const [priorityLevel, setPriorityLevel] = useState<any>(null);
  const [complexityLevel, setComplexityLevel] = useState<any>(null);
  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState(1);
  const [timelineEstimate, setTimelineEstimate] = useState<TimelineEstimate | null>(null);

  useEffect(() => {
    const fetchTaskType = async () => {
      if (!taskTypeId) return;
      const {
        data,
        error
      } = await supabase.from('task_types').select('*').eq('id', taskTypeId).single();
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

  useEffect(() => {
    const fetchPriorityLevel = async () => {
      if (!priorityLevelId) return;
      const {
        data,
        error
      } = await supabase.from('priority_levels').select('*').eq('id', priorityLevelId).single();
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

  useEffect(() => {
    const fetchComplexityLevel = async () => {
      if (!complexityLevelId) return;
      const {
        data,
        error
      } = await supabase.from('complexity_levels').select('*').eq('id', complexityLevelId).single();
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

  useEffect(() => {
    const fetchProjectConcurrency = async () => {
      if (!projectId) return;
      try {
        const {
          data,
          error
        } = await supabase.from('projects').select('max_concurrent_tasks').eq('id', projectId).single();
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

  useEffect(() => {
    const fetchQueueCount = async () => {
      if (!projectId) return;
      const {
        count,
        error
      } = await supabase.from('tasks').select('*', {
        count: 'exact',
        head: true
      }).eq('project_id', projectId).in('current_status_id', [1, 2, 3]);
      if (error) {
        console.error("Error fetching queue position:", error);
        return;
      }
      return count || 0;
    };

    const calculateTimeline = async () => {
      try {
        const now = new Date();
        let startTime: Date | null = null;
        let eta: Date | null = null;
        let hoursNeeded: number | null = null;
        let timeToStart: number | null = null;
        let isOverdue = false;
        
        // Get active tasks count
        const activeCount = await fetchQueueCount();
        
        if (taskType && priorityLevel && complexityLevel) {
          startTime = new Date();
          if (priorityLevel.time_to_start) {
            const timeToStartMatch = priorityLevel.time_to_start.match(/(\d+):(\d+):(\d+)/);
            if (timeToStartMatch) {
              const hours = parseInt(timeToStartMatch[1]);
              const minutes = parseInt(timeToStartMatch[2]);
              timeToStart = hours + minutes / 60;
              
              // Apply the new case-based logic for start time calculation
              
              // Case 1: No active tasks ahead - just add time_to_start
              if (activeCount === 0) {
                startTime = addHours(startTime, hours);
                startTime = addMinutes(startTime, minutes);
              } 
              // Case 2 & 3: There are active or queued tasks ahead
              else {
                // Just add a standard delay - this is a simplified version of what the database function does
                startTime = addHours(startTime, Math.max(1, hours));
              }
            }
          }
          
          // Apply queue delay if provided - updated calculation based on SQL function
          if (queuePosition !== null && queuePosition > maxConcurrentTasks) {
            const queueDelay = (queuePosition - maxConcurrentTasks) * 30; // 30 minutes per position beyond max_concurrent_tasks
            startTime = addMinutes(startTime, queueDelay);
          }
          
          // Handle working hours
          const currentHour = startTime.getHours();
          if (currentHour < 10) {
            startTime.setHours(10, 0, 0, 0);
          } else if (currentHour >= 18) {
            startTime = addDays(startTime, 1);
            startTime.setHours(10, 0, 0, 0);
          }
          
          // Calculate hours needed based on new formula: time_to_start + (base_duration * complexity_multiplier)
          hoursNeeded = 0;
          
          // Add base duration
          if (taskType.base_duration) {
            const baseDurationMatch = taskType.base_duration.match(/(\d+):(\d+):(\d+)/);
            if (baseDurationMatch) {
              const hours = parseInt(baseDurationMatch[1]);
              const minutes = parseInt(baseDurationMatch[2]);
              const baseDuration = hours + minutes / 60;
              
              // Apply complexity multiplier (priority multiplier removed)
              if (complexityLevel.multiplier) {
                hoursNeeded = baseDuration * complexityLevel.multiplier;
              } else {
                hoursNeeded = baseDuration;
              }
            }
          }
          
          // Calculate ETA
          eta = new Date(startTime);
          eta = addHours(eta, hoursNeeded);
          
          // Handle working hours for ETA
          const etaHour = eta.getHours();
          const workingHoursInDay = 8;
          if (etaHour >= 18) {
            const hoursOver = etaHour - 18;
            const daysToAdd = Math.floor(hoursOver / workingHoursInDay) + 1;
            const remainingHours = hoursOver % workingHoursInDay;
            eta = addDays(eta, daysToAdd);
            eta.setHours(10 + remainingHours, eta.getMinutes(), 0, 0);
          }
          
          // Determine if task will be overdue
          isOverdue = priorityLevel.id >= 4 && differenceInHours(eta, now) > 48;
        }
        
        setTimelineEstimate({
          currentTime: format(now, 'h:mm a'),
          startTime: startTime ? format(startTime, 'h:mm a, MMM d') : null,
          eta: eta ? format(eta, 'h:mm a, MMM d') : null,
          queuePosition: queuePosition,
          taskInfo: {
            hoursNeeded: hoursNeeded ? Math.round(hoursNeeded * 10) / 10 : null,
            timeToStart: timeToStart,
            isOverdue
          }
        });
      } catch (error) {
        console.error("Error calculating timeline:", error);
        const now = new Date();
        setTimelineEstimate({
          currentTime: format(now, 'h:mm a'),
          startTime: null,
          eta: null,
          queuePosition: queuePosition,
          taskInfo: {
            hoursNeeded: null,
            timeToStart: null,
            isOverdue: false
          }
        });
      }
      setIsLoading(false);
    };
    setIsLoading(true);
    calculateTimeline();
  }, [taskType, priorityLevel, complexityLevel, queuePosition, maxConcurrentTasks, projectId]);

  if (isLoading) {
    return <div className="space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>;
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
    return <>
        {parts[0]}<br />{parts[1]}
      </>;
  };

  return <div className="sticky top-0 bg-background z-10">
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

        {timelineEstimate?.taskInfo.isOverdue && <div className="flex items-start text-yellow-600 text-xs p-2 bg-yellow-50 rounded-md border border-yellow-200 mt-1">
            <AlertTriangle size={14} className="mt-0.5 mr-1 flex-shrink-0" />
            <span>
              This task may take longer than expected. Consider adjusting priority or complexity.
            </span>
          </div>}
          
        {timelineEstimate?.queuePosition !== null && timelineEstimate.queuePosition > maxConcurrentTasks && (
          <div className="flex items-center text-blue-600 text-xs p-2 bg-blue-50 rounded-md border border-blue-200 mt-2">
            <span>
              Queue position #{timelineEstimate.queuePosition} (adds {(timelineEstimate.queuePosition - maxConcurrentTasks) * 30} min delay)
            </span>
          </div>
        )}
      </div>
    </div>;
};
