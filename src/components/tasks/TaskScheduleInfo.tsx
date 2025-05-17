
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
        <Card className="mb-6">
          <CardContent className="pt-6">
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
        <Card className="mb-6 border-amber-200 bg-amber-50">
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
      <Card className="mb-6 border-blue-100 bg-blue-50">
        <CardContent className="py-4">
          <div className="relative">
            {/* Timeline bar */}
            <div className="absolute top-1/2 left-8 right-8 h-[2px] -translate-y-1/2 bg-blue-300"></div>
            
            {/* Start time with clock icon */}
            <div className="flex items-center justify-between">
              <div className="relative z-10 flex flex-col items-center">
                <div className="bg-white rounded-full p-1 border border-blue-300">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">Start</p>
                  <p className="text-sm font-medium">{estStart}</p>
                </div>
              </div>
              
              {/* Duration in the middle */}
              <div className="relative z-10">
                <div className="bg-white rounded-lg px-3 py-1 border border-blue-300">
                  <span className="text-sm font-medium text-blue-700">{duration}</span>
                </div>
              </div>
              
              {/* End time with clock icon */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="bg-white rounded-full p-1 border border-blue-300">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">ETA</p>
                  <p className="text-sm font-medium">{estEnd}</p>
                </div>
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
