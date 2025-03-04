
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TimelineDataProvider } from "./TimelineDataProvider";
import { TimelineNodes } from "./TimelineNodes";
import { TimelineWarning } from "./TimelineWarning";

interface TimelineVisualizationProps {
  taskTypeId?: number | null;
  priorityLevelId?: number | null;
  complexityLevelId?: number | null;
  projectId?: string;
  compact?: boolean;
}

export const TimelineVisualization = ({
  taskTypeId,
  priorityLevelId,
  complexityLevelId = 3,
  projectId,
  compact = false
}: TimelineVisualizationProps) => {
  return (
    <TimelineDataProvider
      taskTypeId={taskTypeId}
      priorityLevelId={priorityLevelId}
      complexityLevelId={complexityLevelId}
      projectId={projectId}
    >
      {({ isLoading, timelineEstimate }) => (
        <div className="sticky top-0 bg-background z-10 border-b">
          <div className="py-1">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <TimelineNodes
                  timelineEstimate={timelineEstimate}
                  compact={compact}
                />
                <TimelineWarning timelineEstimate={timelineEstimate} />
              </>
            )}
          </div>
        </div>
      )}
    </TimelineDataProvider>
  );
};
