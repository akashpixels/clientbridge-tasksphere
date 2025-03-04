
import React from "react";
import { Circle } from "lucide-react";
import { formatTimelineTime, formatHourDifference } from "@/lib/date-utils";
import { TimelineEstimate } from "./timeline-utils";

interface TimelineNodesProps {
  timelineEstimate: TimelineEstimate | null;
  compact?: boolean;
}

export const TimelineNodes: React.FC<TimelineNodesProps> = ({
  timelineEstimate,
  compact = false
}) => {
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

  return (
    <div className="relative">
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[1px] bg-gray-300 z-0"></div>
      
      <div className="absolute top-0 left-1/4 -translate-x-1/2 text-[9px] text-gray-500 font-medium">
        {getTimeBetweenNodes('start')}
      </div>
      
      <div className="absolute top-0 right-1/4 -translate-x-1/2 text-[9px] text-gray-500 font-medium">
        {getTimeBetweenNodes('eta')}
      </div>
      
      <div className="flex justify-between items-center my-2">
        <div className="flex flex-col items-center z-10">
          <div className="relative flex items-center justify-center">
            <Circle className="w-5 h-5 text-primary fill-white stroke-[1.5]" />
          </div>
          <div className={timeClassName + " text-gray-700"}>
            {timelineEstimate?.currentTime || "--"}
          </div>
        </div>
        
        <div className="flex flex-col items-center z-10">
          <div className={`${compact ? 'w-14 h-6' : 'w-18 h-7'} rounded-full border border-gray-300 bg-white flex items-center justify-center ${compact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-700`}>
            Start time
          </div>
          <div className={timeClassName + " text-gray-700"}>
            {formatTimelineTime(timelineEstimate?.startTime) || "--"}
          </div>
        </div>
        
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
  );
};
