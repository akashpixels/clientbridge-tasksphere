import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskScheduleInfoProps {
  estStart?: string;
  estEnd?: string;
  duration?: string;
  loading: boolean;
  error: string | null;
}

const TaskScheduleInfo = ({
  estStart,
  estEnd,
  duration,
  loading,
  error,
}: TaskScheduleInfoProps) => {
  // Memoize content for performance
  const content = useMemo(() => {
    // Loading state
    if (loading && !estStart && !estEnd && !duration) {
      return (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <h3 className="text-xs font-semibold mb-2">Estimated Schedule</h3>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      );
    }

    // Error state
    if (error) {
      return (
        <Card className="mt-4 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold mb-1">Unable to calculate schedule</h3>
                <p className="text-xs text-gray-500">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // No data
    if (!estStart && !estEnd && !duration) {
      return null;
    }

    // Main content
    return (
      <Card className="mt-4 border-blue-100 bg-blue-50">
        <CardContent className="pt-4 pb-4">
          <h3 className="text-xs font-semibold mb-2">Estimated Schedule</h3>

          {/* Timeline visualization */}
          <div className="relative flex flex-col items-center w-full">
            {/* Timeline bar with vertical, horizontal, clock */}
            <div className="flex items-center justify-between w-full relative" style={{ minHeight: 40 }}>
              {/* Vertical bar at start */}
              <div className="flex flex-col items-center" style={{ width: "26px" }}>
                <span className="text-blue-500 text-xl font-bold" style={{ lineHeight: "20px" }}>|</span>
              </div>
              {/* Duration above line, centered */}
              {duration && (
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 -top-4 z-10"
                  style={{ minWidth: 32 }}
                >
                  <span className="text-xs font-semibold bg-blue-50 px-2 rounded">{duration}</span>
                </div>
              )}
              {/* Horizontal line */}
              <div className="flex-1 h-0.5 bg-blue-200" style={{ marginTop: "16px" }} />
              {/* Clock icon at end */}
              <div className="flex flex-col items-center" style={{ width: "26px" }}>
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </div>

            {/* Labels and time values below */}
            <div className="flex justify-between w-full mt-2 px-2">
              <div className="flex flex-col items-center min-w-[70px]">
                <span className="text-[11px] font-medium">Start</span>
                <span className="text-[11px] text-gray-700 text-center whitespace-nowrap" style={{ maxWidth: 90 }}>
                  {estStart || "N/A"}
                </span>
              </div>
              <div className="flex-1" />
              <div className="flex flex-col items-center min-w-[70px]">
                <span className="text-[11px] font-medium">ETA</span>
                <span className="text-[11px] text-gray-700 text-center whitespace-nowrap" style={{ maxWidth: 90 }}>
                  {estEnd || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [estStart, estEnd, duration, loading, error]);

  return content;
};

export default TaskScheduleInfo;
