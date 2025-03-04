import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addHours, addDays, addMinutes, differenceInHours } from "date-fns";
import { AlertTriangle, Circle } from "lucide-react";
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
  // ... (previous state and useEffect hooks remain the same)

  const getTimeBetweenNodes = (nodeType: 'start' | 'eta') => {
    if (nodeType === 'start') {
      if (!timelineEstimate?.taskInfo.timeToStart) return "--";
      return `${formatHourDifference(timelineEstimate.taskInfo.timeToStart)}`;
    } else {
      if (!timelineEstimate?.taskInfo.hoursNeeded) return "--";
      return formatHourDifference(timelineEstimate.taskInfo.hoursNeeded);
    }
  };

  const pillClassName = compact 
    ? "w-12 h-6 rounded-full border border-gray-300 text-[10px]" 
    : "w-16 h-8 rounded-full border border-gray-300 text-xs";

  const timeClassName = compact ? "text-[9px] mt-1.5" : "text-[10px] mt-2";

  return <div className="sticky top-0 bg-background z-10 border-b">
      <div className="py-1">
        <div className="relative">
          {/* Time between nodes */}
          <div className="absolute top-0 left-1/4 -translate-x-1/2 text-[9px] text-gray-500 font-medium">
            {getTimeBetweenNodes('start')}
          </div>
          
          <div className="absolute top-0 right-1/4 -translate-x-1/2 text-[9px] text-gray-500 font-medium">
            {getTimeBetweenNodes('eta')}
          </div>

          {/* Timeline container with absolute positioning for line */}
          <div className="relative flex justify-between items-center my-2">
            {/* Absolute positioned line */}
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-gray-300 -translate-y-1/2 -z-0"></div>

            {/* Left Circle (Current Time) */}
            <div className="flex flex-col items-center z-10">
              <Circle className="w-5 h-5 text-primary fill-white stroke-[1.5]" />
              <div className={timeClassName + " text-gray-700"}>
                {timelineEstimate?.currentTime || "--"}
              </div>
            </div>

            {/* Start Time Pill */}
            <div className="flex flex-col items-center z-10">
              <div className={`${compact ? 'w-14 h-6' : 'w-18 h-7'} rounded-full border border-gray-300 bg-white flex items-center justify-center ${compact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-700`}>
                Start time
              </div>
              <div className={timeClassName + " text-gray-700"}>
                {formatTimelineTime(timelineEstimate?.startTime) || "--"}
              </div>
            </div>

            {/* ETA Pill */}
            <div className="flex flex-col items-center z-10">
              <div className={`${pillClassName} border-gray-300 bg-white flex items-center justify-center font-medium text-gray-700`}>
                ETA
              </div>
              <div className={timeClassName + " text-gray-700"}>
                {formatTimelineTime(timelineEstimate?.eta) || "--"}
              </div>
            </div>
          </div>
        </div>

        {timelineEstimate?.taskInfo.isOverdue && <div className="flex items-start text-yellow-600 text-xs p-2 bg-yellow-50 rounded-md border border-yellow-200 mt-2">
            <AlertTriangle size={14} className="mt-0.5 mr-1 flex-shrink-0" />
            <span>
              This task may take longer than expected. Consider adjusting priority or complexity.
            </span>
          </div>}
      </div>
    </div>;
};
