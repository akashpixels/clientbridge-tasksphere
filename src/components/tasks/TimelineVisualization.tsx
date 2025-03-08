
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDuration } from "@/lib/date-utils";
import { addDays, addWeeks, format, formatDistance, parseISO } from "date-fns";
import { Clock, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface TimelineVisualizationProps {
  taskTypeId: number | null;
  priorityLevelId: number | null;
  complexityLevelId: number | null;
  projectId: string | undefined;
  compact?: boolean;
  queuePosition?: number;
}

export const TimelineVisualization = ({
  taskTypeId,
  priorityLevelId,
  complexityLevelId,
  projectId,
  compact = false,
  queuePosition
}: TimelineVisualizationProps) => {
  const [taskType, setTaskType] = useState<any>(null);
  const [priority, setPriority] = useState<any>(null);
  const [complexity, setComplexity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estimatedStartDate, setEstimatedStartDate] = useState<Date | null>(null);
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState<Date | null>(null);

  const calculateDates = async () => {
    if (!taskTypeId || !priorityLevelId || !complexityLevelId || !projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get current date/time as starting point
      const now = new Date();
      
      // Fetch task type info (for base duration)
      const { data: taskTypeData, error: taskTypeError } = await supabase
        .from('task_types')
        .select('name, base_duration')
        .eq('id', taskTypeId)
        .single();
      
      if (taskTypeError) throw taskTypeError;
      setTaskType(taskTypeData);
      
      // Fetch priority info (for time to start and multiplier)
      const { data: priorityData, error: priorityError } = await supabase
        .from('priority_levels')
        .select('name, time_to_start, multiplier, color')
        .eq('id', priorityLevelId)
        .single();
      
      if (priorityError) throw priorityError;
      setPriority(priorityData);
      
      // Fetch complexity info (for multiplier)
      const { data: complexityData, error: complexityError } = await supabase
        .from('complexity_levels')
        .select('name, multiplier')
        .eq('id', complexityLevelId)
        .single();
      
      if (complexityError) throw complexityError;
      setComplexity(complexityData);
      
      // Estimate start date based on priority
      let startDate = new Date(now);
      
      // For priority, add time to start
      if (priorityData.time_to_start) {
        const timeToStartHours = parseTimeToStartToHours(priorityData.time_to_start);
        startDate = addHours(startDate, timeToStartHours);
      }
      
      // Adjust for weekends
      while (startDate.getDay() === 0 || startDate.getDay() === 6) {
        startDate = addDays(startDate, 1);
      }
      
      setEstimatedStartDate(startDate);
      
      // Calculate completion date based on base duration and multipliers
      let completionDate = new Date(startDate);
      
      // Get base duration in hours
      let baseDurationHours = 0;
      if (taskTypeData.base_duration) {
        baseDurationHours = parseBaseDurationToHours(taskTypeData.base_duration);
      } else {
        // Default to 2 hours if no base duration
        baseDurationHours = 2;
      }
      
      // Apply multipliers
      const priorityMultiplier = priorityData.multiplier || 1;
      const complexityMultiplier = complexityData.multiplier || 1;
      
      const totalDurationHours = baseDurationHours * priorityMultiplier * complexityMultiplier;
      
      // Add the calculated hours to the start date
      completionDate = addHours(completionDate, totalDurationHours);
      
      // Adjust for weekends
      while (completionDate.getDay() === 0 || completionDate.getDay() === 6) {
        completionDate = addDays(completionDate, 1);
      }
      
      setEstimatedCompletionDate(completionDate);
      setLoading(false);
    } catch (err: any) {
      console.error("Error calculating timeline:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Parse interval string to hours
  const parseTimeToStartToHours = (timeToStart: string): number => {
    // Format is expected to be "X hours" or "X days"
    if (timeToStart.includes('hours')) {
      return parseInt(timeToStart);
    } else if (timeToStart.includes('days')) {
      return parseInt(timeToStart) * 24;
    } else if (timeToStart.includes('weeks')) {
      return parseInt(timeToStart) * 24 * 7;
    }
    return 0;
  };
  
  // Parse interval to hours
  const parseBaseDurationToHours = (baseDuration: string): number => {
    // Format is expected to be "X hours" or "X days"
    if (baseDuration.includes('hours')) {
      return parseInt(baseDuration);
    } else if (baseDuration.includes('days')) {
      return parseInt(baseDuration) * 24;
    } else if (baseDuration.includes('weeks')) {
      return parseInt(baseDuration) * 24 * 7;
    }
    return 0;
  };
  
  // Helper function to add hours to a date
  const addHours = (date: Date, hours: number): Date => {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
  };

  useEffect(() => {
    calculateDates();
  }, [taskTypeId, priorityLevelId, complexityLevelId, projectId]);

  if (loading) {
    return (
      <div className="w-full bg-gray-50 rounded-lg p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 rounded-lg p-4 flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
        <div>
          <p className="text-sm text-red-700">Error calculating timeline</p>
          <p className="text-xs text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!taskTypeId || !priorityLevelId || !complexityLevelId) {
    return (
      <div className="w-full bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-500">
          Select task properties to see estimated timeline
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`w-full ${compact ? 'bg-gray-50' : 'bg-white border'} rounded-lg p-4`}>
        <div className="flex items-center mb-3">
          <Clock className="h-4 w-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium">Estimated Timeline</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-gray-500">Start</div>
              <div className="text-sm font-medium">
                {estimatedStartDate ? format(estimatedStartDate, "MMM d, h:mm a") : "Unknown"}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-gray-500">Complete</div>
              <div className="text-sm font-medium">
                {estimatedCompletionDate ? format(estimatedCompletionDate, "MMM d, h:mm a") : "Unknown"}
              </div>
            </div>
          </div>
          
          <div className="relative pt-2">
            <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
              {priority && (
                <div 
                  className="h-full"
                  style={{ 
                    width: '100%', 
                    backgroundColor: priority.color || '#6366f1'
                  }}
                ></div>
              )}
            </div>
            
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>Now</div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Current date and time</p>
                </TooltipContent>
              </Tooltip>
              
              {estimatedCompletionDate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      {formatDistance(
                        new Date(), 
                        estimatedCompletionDate, 
                        { addSuffix: true }
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Estimated completion time</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
