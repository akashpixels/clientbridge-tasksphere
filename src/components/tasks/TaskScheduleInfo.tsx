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

// Helper function to format time (e.g., "4:00 PM")
const formatTime = (dateTimeString?: string): string => {
  if (!dateTimeString) return "N/A";
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return dateTimeString; // Return original if not a valid date (e.g. "N/A")
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return dateTimeString; // Fallback
  }
};

// Helper function to format date as "Month Day" (e.g., "May 19")
const formatDateMonthDay = (dateTimeString?: string): string => {
  if (!dateTimeString) return "N/A"; // Consistent handling for N/A
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return dateTimeString; // Return original if not a valid date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateTimeString; // Fallback
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

    const startTime = formatTime(estStart);
    const startDate = formatDateMonthDay(estStart);
    const endTime = formatTime(estEnd);
    const endDate = formatDateMonthDay(estEnd);

    return (
      <Card className="mt-4 border-blue-100 bg-blue-50">
        <CardContent className="py-1">
          <h3 className="text-xs font-semibold mb-2">Estimated Schedule</h3>
          <div className="relative flex flex-col items-center w-full">
            {duration && (
              <div className="mb-1">
                <span className="text-xs font-semibold bg-blue-50 px-2 rounded">{duration}</span>
              </div>
            )}
            <div className="flex items-center w-full justify-between" style={{ height: 28 }}>
              <span className="text-blue-500 text-xl  flex items-center justify-center" style={{height: '20px', lineHeight: '18px'}}>|</span>
              <div className="flex-1 h-0.5 bg-blue-200 relative" />
              <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" style={{marginBottom: '2px'}} />
            </div>
            {/* Start/ETA times below - MODIFIED for new format and alignment */}
            <div className="flex justify-between w-full mt-2 ">
              {/* Start Time/Date Block - Left Aligned */}
              <div className="flex flex-col items-start min-w-[70px] md:min-w-[80px]"> {/* Adjust min-w as needed */}
                <span className="text-[11px] text-gray-700 whitespace-nowrap">{startTime}</span>
                <span className="text-[11px] text-gray-700 whitespace-nowrap">{startDate}</span>
              </div>
              {/* ETA Time/Date Block - Right Aligned */}
              <div className="flex flex-col items-end min-w-[70px] md:min-w-[80px]"> {/* Adjust min-w as needed */}
                <span className="text-[11px] text-gray-700 whitespace-nowrap">{endTime}</span>
                <span className="text-[11px] text-gray-700 whitespace-nowrap">{endDate}</span>
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