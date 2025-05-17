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

// Helper function to format date-time strings without the year
const formatDateTimeWithoutYear = (dateTimeString?: string): string => {
  if (!dateTimeString) {
    return "N/A";
  }
  try {
    const date = new Date(dateTimeString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return dateTimeString; // Return original string if it's not a valid date (e.g., already "N/A")
    }
    // Format to "Month Day, HH:MM AM/PM" (e.g., "May 17, 10:30 AM")
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleString('en-US', options);
  } catch (e) {
    // Fallback to the original string in case of any unexpected error during parsing/formatting
    return dateTimeString;
  }
};

const TaskScheduleInfo = ({
  estStart,
  estEnd,
  duration,
  loading,
  error,
}: TaskScheduleInfoProps) => {
  const content = useMemo(() => {
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

    if (!estStart && !estEnd && !duration) {
      return null;
    }

    const formattedEstStart = formatDateTimeWithoutYear(estStart);
    const formattedEstEnd = formatDateTimeWithoutYear(estEnd);

    return (
      <Card className="mt-4 border-blue-100 bg-blue-50">
        <CardContent className="pt-4 pb-4">
          <h3 className="text-xs font-semibold mb-2">Estimated Schedule</h3>
          {/* Timeline visualization */}
          <div className="relative flex flex-col items-center w-full">
            {/* Duration above */}
            {duration && (
              <div className="mb-1">
                <span className="text-xs font-semibold bg-blue-50 px-2 rounded">{duration}</span>
              </div>
            )}
            {/* Aligned Timeline */}
            <div className="flex items-center w-full justify-between px-4" style={{ height: 28 }}>
              {/* Vertical bar at start */}
              <span className="text-blue-500 text-xl font-bold flex items-center justify-center" style={{height: '20px', lineHeight: '18px'}}>|</span>
              {/* Horizontal line (mx-2 removed) */}
              <div className="flex-1 h-0.5 bg-blue-200 relative" />
              {/* Clock icon at end */}
              <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" style={{marginBottom: '2px'}} />
            </div>
            {/* Start/ETA times below (labels removed, year removed from time) */}
            <div className="flex justify-between w-full mt-2 px-4">
              <div className="flex flex-col items-center min-w-[70px]">
                {/* "Start" label removed */}
                <span className="text-[11px] text-gray-700 text-center whitespace-nowrap">{formattedEstStart}</span>
              </div>
              <div className="flex flex-col items-center min-w-[70px]">
                {/* "ETA" label removed */}
                <span className="text-[11px] text-gray-700 text-center whitespace-nowrap">{formattedEstEnd}</span>
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