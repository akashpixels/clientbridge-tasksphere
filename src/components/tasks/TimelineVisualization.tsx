
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
}

interface TimelineEstimate {
  currentTime: string;
  startTime: string | null;
  eta: string | null;
  queuePosition: number;
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
  compact = false
}: TimelineVisualizationProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [taskType, setTaskType] = useState<any>(null);
  const [priorityLevel, setPriorityLevel] = useState<any>(null);
  const [complexityLevel, setComplexityLevel] = useState<any>(null);
  const [queuePosition, setQueuePosition] = useState(0);
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
    const fetchQueuePosition = async () => {
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
      setQueuePosition(count || 0);
    };
    if (projectId) {
      fetchQueuePosition();
    }
  }, [projectId]);

  useEffect(() => {
    const calculateTimeline = async () => {
      try {
        const now = new Date();
        let startTime: Date | null = null;
        let eta: Date | null = null;
        let hoursNeeded: number | null = null;
        let timeToStart: number | null = null;
        let isOverdue = false;

        if (taskType && priorityLevel && complexityLevel) {
          startTime = new Date();

          if (priorityLevel.time_to_start) {
            const timeToStartMatch = priorityLevel.time_to_start.match(/(\d+):(\d+):(\d+)/);
            if (timeToStartMatch) {
              const hours = parseInt(timeToStartMatch[1]);
              const minutes = parseInt(timeToStartMatch[2]);
              timeToStart = hours + minutes / 60;
              startTime = addHours(startTime, hours);
              startTime = addMinutes(startTime, minutes);
            }
          }

          startTime = addMinutes(startTime, queuePosition * 30);

          const currentHour = startTime.getHours();
          if (currentHour < 10) {
            startTime.setHours(10, 0, 0, 0);
          } else if (currentHour >= 18) {
            startTime = addDays(startTime, 1);
            startTime.setHours(10, 0, 0, 0);
          }

          hoursNeeded = 1;
          if (taskType.base_duration) {
            const baseDurationMatch = taskType.base_duration.match(/(\d+):(\d+):(\d+)/);
            if (baseDurationMatch) {
              const hours = parseInt(baseDurationMatch[1]);
              const minutes = parseInt(baseDurationMatch[2]);
              hoursNeeded = hours + minutes / 60;
            }
          }

          if (priorityLevel.multiplier) {
            hoursNeeded *= priorityLevel.multiplier;
          }
          if (complexityLevel.multiplier) {
            hoursNeeded *= complexityLevel.multiplier;
          }

          eta = new Date(startTime);
          eta = addHours(eta, hoursNeeded);

          const etaHour = eta.getHours();
          const workingHoursInDay = 8;
          if (etaHour >= 18) {
            const hoursOver = etaHour - 18;
            const daysToAdd = Math.floor(hoursOver / workingHoursInDay) + 1;
            const remainingHours = hoursOver % workingHoursInDay;
            eta = addDays(eta, daysToAdd);
            eta.setHours(10 + remainingHours, eta.getMinutes(), 0, 0);
          }

          isOverdue = priorityLevel.id >= 4 && differenceInHours(eta, now) > 48;
        }

        setTimelineEstimate({
          currentTime: format(now, 'h:mm a'),
          startTime: startTime ? format(startTime, 'h:mm a, MMM d') : null,
          eta: eta ? format(eta, 'h:mm a, MMM d') : null,
          queuePosition,
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
          queuePosition,
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
  }, [taskType, priorityLevel, complexityLevel, queuePosition]);

  if (isLoading) {
    return <div className="space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>;
  }

  const getTimeBetweenNodes = (nodeType: 'start' | 'eta') => {
    if (nodeType === 'start') {
      if (!timelineEstimate?.taskInfo.timeToStart) return "--";
      return `${formatHourDifference(timelineEstimate.taskInfo.timeToStart)}`;
    } else {
      if (!timelineEstimate?.taskInfo.hoursNeeded) return "--";
      return formatHourDifference(timelineEstimate.taskInfo.hoursNeeded);
    }
  };

  return <div className="sticky top-0 bg-background z-10 border-b">
      <div className="py-3">
        <div className="relative">
          <div className="absolute top-[-13px] left-1/4 -translate-x-1/2 text-[9px] text-gray-400 font-medium">
            {getTimeBetweenNodes('start')}
          </div>
          
          <div className="absolute top-[-13px] right-1/4 -translate-x-1/2 text-[9px] text-gray-400 font-medium">
            {getTimeBetweenNodes('eta')}
          </div>
          
          <div className="flex justify-between items-center mb-2 pt-1 pb-1 relative">
            {/* The horizontal line now starts exactly from the left edge */}
            <div className="absolute top-[16px] left-0 right-0 h-[1px] bg-gray-300 z-0"></div>
            
            {/* First column with vertical line positioned exactly at start of horizontal line */}
            <div className="flex flex-col items-start z-10 pl-0">
              <div className="relative h-[20px] flex items-center">
               
                <div className="w-[1.5px] h-[13px] bg-gray-300 absolute left-0 top-[16px]"></div>

              </div>
              <div className="text-[9px] mt-0.5 text-gray-500">
                {timelineEstimate?.currentTime || "--"}
              </div>
            </div>
            
            <div className="flex flex-col items-center z-10">
              <div className="h-[22px] w-[40px] rounded-full border border-gray-200 bg-white flex items-center justify-center text-[10px] font-medium text-gray-600">
                Start
              </div>
              <div className="text-[9px] mt-0.5 text-gray-500">
                {formatTimelineTime(timelineEstimate?.startTime) || "--"}
              </div>
            </div>
            
            <div className="flex flex-col items-center z-10">
              <div className="h-[22px] w-[35px] rounded-full border border-gray-200 bg-white flex items-center justify-center text-[10px] font-medium text-gray-600">
                ETA
              </div>
              <div className="text-[9px] mt-0.5 text-gray-500">
                {formatTimelineTime(timelineEstimate?.eta) || "--"}
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
      </div>
    </div>;
};
