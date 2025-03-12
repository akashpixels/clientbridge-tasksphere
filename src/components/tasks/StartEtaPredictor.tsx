
import { Skeleton } from "@/components/ui/skeleton";
import { useTimelineEstimate } from "@/hooks/useTimelineEstimate";
import { TimelineDisplay } from "./TimelineDisplay";

interface StartEtaPredictorProps {
  taskTypeId?: number | null;
  priorityLevelId?: number | null;
  complexityLevelId?: number | null;
  projectId?: string;
  compact?: boolean;
  activeTaskCount?: number | null;
}

export const StartEtaPredictor = ({
  taskTypeId,
  priorityLevelId = 2,
  complexityLevelId = 3,
  projectId,
  compact = false,
  activeTaskCount = null
}: StartEtaPredictorProps) => {
  const { isLoading, timelineEstimate } = useTimelineEstimate({
    taskTypeId,
    priorityLevelId,
    complexityLevelId,
    projectId,
    activeTaskCount
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <TimelineDisplay 
      timelineEstimate={timelineEstimate}
      compact={compact}
    />
  );
};
