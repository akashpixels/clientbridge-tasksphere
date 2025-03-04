
import React from "react";
import { AlertTriangle } from "lucide-react";
import { TimelineEstimate } from "./timeline-utils";

interface TimelineWarningProps {
  timelineEstimate: TimelineEstimate | null;
}

export const TimelineWarning: React.FC<TimelineWarningProps> = ({ timelineEstimate }) => {
  if (!timelineEstimate?.taskInfo.isOverdue) {
    return null;
  }

  return (
    <div className="flex items-start text-yellow-600 text-xs p-2 bg-yellow-50 rounded-md border border-yellow-200 mt-2">
      <AlertTriangle size={14} className="mt-0.5 mr-1 flex-shrink-0" />
      <span>
        This task may take longer than expected. Consider adjusting priority or complexity.
      </span>
    </div>
  );
};
