
import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, Clock, AlertCircle } from "lucide-react";
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
  error 
}: TaskScheduleInfoProps) => {
  // Use useMemo to prevent unnecessary re-renders
  const content = useMemo(() => {
    // Show loading state only on initial load, not during subsequent updates
    if (loading && !estStart && !estEnd && !duration) {
      return (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium mb-2">Estimated Schedule</h3>
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
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
                <h3 className="text-sm font-medium mb-1">Unable to calculate schedule</h3>
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

    return (
      <Card className="mt-4 border-blue-100 bg-blue-50">
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium mb-3">Estimated Schedule</h3>
          
          {/* Timeline visualization */}
          <div className="relative flex items-center justify-between mt-6 mb-6 px-2">
            {/* Start time with icon */}
            <div className="flex flex-col items-center gap-1 z-10">
              <Clock className="h-6 w-6 text-blue-500" />
              <span className="text-xs font-medium">Start</span>
              <span className="text-xs">{estStart || "N/A"}</span>
            </div>
            
            {/* Timeline line */}
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-blue-200 z-0" />
            
            {/* Duration indicator in the middle */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10 bg-blue-50 px-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span className="text-xs font-medium">Duration</span>
              <span className="text-xs">{duration || "N/A"}</span>
            </div>
            
            {/* End time with icon */}
            <div className="flex flex-col items-center gap-1 z-10">
              <Clock className="h-6 w-6 text-blue-500" />
              <span className="text-xs font-medium">ETA</span>
              <span className="text-xs">{estEnd || "N/A"}</span>
            </div>
          </div>

          {/* Original detailed info (optional, can be hidden if the visual timeline is enough) */}
          <div className="space-y-2 mt-2 hidden">
            {estStart && (
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Start: <span className="font-medium">{estStart}</span></span>
              </div>
            )}
            
            {estEnd && (
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">ETA: <span className="font-medium">{estEnd}</span></span>
              </div>
            )}
            
            {duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Estimated Duration: <span className="font-medium">{duration}</span></span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }, [estStart, estEnd, duration, loading, error]);

  return content;
};

export default TaskScheduleInfo;
