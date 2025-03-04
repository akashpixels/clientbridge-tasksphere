
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addHours, addDays, addMinutes, differenceInHours } from "date-fns";
import { AlertTriangle, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TimelineVisualizationProps {
  taskTypeId?: number | null;
  priorityLevelId?: number | null;
  complexityLevelId?: number | null;
  projectId?: string;
}

interface TimelineEstimate {
  currentTime: string;
  startTime: string | null;
  eta: string | null;
  queuePosition: number;
  taskInfo: {
    hoursNeeded: number | null;
    isOverdue: boolean;
  };
}

export const TimelineVisualization = ({
  taskTypeId,
  priorityLevelId,
  complexityLevelId = 3,
  projectId
}: TimelineVisualizationProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [taskType, setTaskType] = useState<any>(null);
  const [priorityLevel, setPriorityLevel] = useState<any>(null);
  const [complexityLevel, setComplexityLevel] = useState<any>(null);
  const [queuePosition, setQueuePosition] = useState(0);
  const [timelineEstimate, setTimelineEstimate] = useState<TimelineEstimate | null>(null);
  
  // Fetch task type details
  useEffect(() => {
    const fetchTaskType = async () => {
      if (!taskTypeId) return;
      
      const { data, error } = await supabase
        .from('task_types')
        .select('*')
        .eq('id', taskTypeId)
        .single();
      
      if (error) {
        console.error("Error fetching task type:", error);
        return;
      }
      
      setTaskType(data);
    };
    
    if (taskTypeId) {
      fetchTaskType();
    } else {
      setTaskType(null);
    }
  }, [taskTypeId]);

  // Fetch priority level details
  useEffect(() => {
    const fetchPriorityLevel = async () => {
      if (!priorityLevelId) return;
      
      const { data, error } = await supabase
        .from('priority_levels')
        .select('*')
        .eq('id', priorityLevelId)
        .single();
      
      if (error) {
        console.error("Error fetching priority level:", error);
        return;
      }
      
      setPriorityLevel(data);
    };
    
    if (priorityLevelId) {
      fetchPriorityLevel();
    } else {
      setPriorityLevel(null);
    }
  }, [priorityLevelId]);

  // Fetch complexity level details
  useEffect(() => {
    const fetchComplexityLevel = async () => {
      if (!complexityLevelId) return;
      
      const { data, error } = await supabase
        .from('complexity_levels')
        .select('*')
        .eq('id', complexityLevelId)
        .single();
      
      if (error) {
        console.error("Error fetching complexity level:", error);
        return;
      }
      
      setComplexityLevel(data);
    };
    
    if (complexityLevelId) {
      fetchComplexityLevel();
    } else {
      setComplexityLevel(null);
    }
  }, [complexityLevelId]);

  // Fetch queue position
  useEffect(() => {
    const fetchQueuePosition = async () => {
      if (!projectId) return;
      
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .in('current_status_id', [1, 2, 3]); // Open, Pending, In Progress
      
      if (error) {
        console.error("Error fetching queue position:", error);
        return;
      }
      
      setQueuePosition(count || 0);
    };
    
    if (projectId) {
      fetchQueuePosition();
    }
  }, [projectId]);

  // Calculate timeline estimate
  useEffect(() => {
    const calculateTimeline = () => {
      try {
        // Current time
        const now = new Date();
        let startTime: Date | null = null;
        let eta: Date | null = null;
        let hoursNeeded: number | null = null;
        let isOverdue = false;
        
        if (taskType && priorityLevel && complexityLevel) {
          // Calculate start time based on priority level's time_to_start
          startTime = new Date();
          if (priorityLevel.time_to_start) {
            // Parse the interval string to get hours and minutes
            const timeToStartMatch = priorityLevel.time_to_start.match(/(\d+):(\d+):(\d+)/);
            if (timeToStartMatch) {
              const hours = parseInt(timeToStartMatch[1]);
              const minutes = parseInt(timeToStartMatch[2]);
              
              startTime = addHours(startTime, hours);
              startTime = addMinutes(startTime, minutes);
            }
          }
          
          // Add queue delay - simplified calculation
          startTime = addMinutes(startTime, queuePosition * 30);
          
          // Adjust for working hours (simplified)
          const currentHour = startTime.getHours();
          if (currentHour < 10) {
            // Before working hours, move to 10:00
            startTime.setHours(10, 0, 0, 0);
          } else if (currentHour >= 18) {
            // After working hours, move to next day 10:00
            startTime = addDays(startTime, 1);
            startTime.setHours(10, 0, 0, 0);
          }
          
          // Calculate hours needed
          hoursNeeded = 1; // Default
          
          if (taskType.base_duration) {
            // Parse base duration interval to hours
            const baseDurationMatch = taskType.base_duration.match(/(\d+):(\d+):(\d+)/);
            if (baseDurationMatch) {
              const hours = parseInt(baseDurationMatch[1]);
              const minutes = parseInt(baseDurationMatch[2]);
              hoursNeeded = hours + (minutes / 60);
            }
          }
          
          // Apply multipliers
          if (priorityLevel.multiplier) {
            hoursNeeded *= priorityLevel.multiplier;
          }
          
          if (complexityLevel.multiplier) {
            hoursNeeded *= complexityLevel.multiplier;
          }
          
          // Calculate ETA
          eta = new Date(startTime);
          eta = addHours(eta, hoursNeeded);
          
          // Adjust ETA for working hours (simplified)
          const etaHour = eta.getHours();
          const workingHoursInDay = 8; // 10:00 to 18:00
          if (etaHour >= 18) {
            const hoursOver = etaHour - 18;
            const daysToAdd = Math.floor(hoursOver / workingHoursInDay) + 1;
            const remainingHours = hoursOver % workingHoursInDay;
            
            eta = addDays(eta, daysToAdd);
            eta.setHours(10 + remainingHours, eta.getMinutes(), 0, 0);
          }
          
          // Check if task would be overdue
          isOverdue = priorityLevel.id >= 4 && differenceInHours(eta, now) > 48;
        }
        
        setTimelineEstimate({
          currentTime: format(now, 'h:mm a'),
          startTime: startTime ? format(startTime, 'h:mm a, MMM d') : null,
          eta: eta ? format(eta, 'h:mm a, MMM d') : null,
          queuePosition,
          taskInfo: {
            hoursNeeded: hoursNeeded ? Math.round(hoursNeeded * 10) / 10 : null, // Round to 1 decimal
            isOverdue
          }
        });
        
      } catch (error) {
        console.error("Error calculating timeline:", error);
        // Set default values when calculation fails
        const now = new Date();
        setTimelineEstimate({
          currentTime: format(now, 'h:mm a'),
          startTime: null,
          eta: null,
          queuePosition,
          taskInfo: {
            hoursNeeded: null,
            isOverdue: false
          }
        });
      }
      
      setIsLoading(false);
    };
    
    setIsLoading(true);
    calculateTimeline();
  }, [taskType, priorityLevel, complexityLevel, queuePosition]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Always return the timeline visualization, even if some data is missing
  return (
    <div className="sticky top-0 bg-background z-10 border-b">
      {/* Queue Position */}
      <div className="border-b px-6 py-3 text-center">
        <div className="text-sm font-medium">
          Queue Position: #{(timelineEstimate?.queuePosition || 0) + 1}
        </div>
      </div>
      
      {/* Timeline visualization */}
      <div className="px-6 py-4 space-y-4">
        {/* Timeline labels */}
        <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
          <span>Now</span>
          <span>Start Time</span>
          <span>ETA</span>
        </div>
        
        {/* Timeline visualization */}
        <div className="relative">
          <div className="flex justify-between items-center">
            {/* Now dot */}
            <div className="flex flex-col items-center z-10">
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-background"></div>
              <div className="text-xs mt-1">{timelineEstimate?.currentTime || "--"}</div>
            </div>
            
            {/* Start time dot */}
            <div className="flex flex-col items-center z-10">
              <div className="w-4 h-4 rounded-full bg-secondary border-2 border-background"></div>
              <div className="text-xs mt-1">{timelineEstimate?.startTime || "--"}</div>
              {timelineEstimate?.taskInfo.hoursNeeded ? (
                <div className="text-xs font-medium mt-1">{timelineEstimate.taskInfo.hoursNeeded} hrs</div>
              ) : (
                <div className="text-xs font-medium mt-1">--</div>
              )}
            </div>
            
            {/* ETA dot */}
            <div className="flex flex-col items-center z-10">
              <div className="w-4 h-4 rounded-full bg-secondary border-2 border-background"></div>
              <div className="text-xs mt-1">{timelineEstimate?.eta || "--"}</div>
            </div>
          </div>
          
          {/* Connecting line - more visible */}
          <div className="absolute top-2 left-0 right-0 h-[2px] bg-border -z-0"></div>
        </div>

        {timelineEstimate?.taskInfo.isOverdue && (
          <div className="flex items-start text-yellow-600 text-xs p-2 bg-yellow-50 rounded-md border border-yellow-200">
            <AlertTriangle size={14} className="mt-0.5 mr-1 flex-shrink-0" />
            <span>
              This task may take longer than expected. Consider adjusting priority or complexity.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
