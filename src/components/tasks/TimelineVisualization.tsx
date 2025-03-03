
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addHours, addDays, addMinutes, differenceInHours } from "date-fns";
import { Info, Clock, Calendar, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TimelineVisualizationProps {
  taskTypeId?: number | null;
  priorityLevelId?: number | null;
  complexityLevelId?: number | null;
  projectId?: string;
}

interface TimelineEstimate {
  startTime: string;
  eta: string;
  queuePosition: number;
  workingHoursInfo: {
    start: string;
    end: string;
  };
  taskInfo: {
    hoursNeeded: number;
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
      if (!taskType || !priorityLevel || !complexityLevel) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Working hours
        const workingStart = "10:00";
        const workingEnd = "18:00";
        
        // Current time
        const now = new Date();
        
        // Calculate start time based on priority level's time_to_start
        let startTime = new Date();
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
        let hoursNeeded = 1; // Default
        
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
        let eta = new Date(startTime);
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
        const isOverdue = priorityLevel.id >= 4 && differenceInHours(eta, now) > 48;
        
        setTimelineEstimate({
          startTime: format(startTime, 'MMM d, yyyy h:mm a'),
          eta: format(eta, 'MMM d, yyyy h:mm a'),
          queuePosition,
          workingHoursInfo: {
            start: workingStart,
            end: workingEnd,
          },
          taskInfo: {
            hoursNeeded: Math.round(hoursNeeded * 10) / 10, // Round to 1 decimal
            isOverdue
          }
        });
        
      } catch (error) {
        console.error("Error calculating timeline:", error);
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
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!taskTypeId || !priorityLevelId || !timelineEstimate) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground p-6">
        <Info size={40} className="mb-2" />
        <h4 className="text-lg font-medium">Timeline Preview</h4>
        <p>Select a task type and priority level to see timeline estimates</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background p-3 rounded-md shadow-sm">
            <div className="flex items-center text-muted-foreground mb-1">
              <Clock size={14} className="mr-1" />
              <span className="text-xs">PROBABLE START TIME</span>
            </div>
            <p className="text-sm font-medium">{timelineEstimate.startTime}</p>
          </div>
          
          <div className="bg-background p-3 rounded-md shadow-sm">
            <div className="flex items-center text-muted-foreground mb-1">
              <Calendar size={14} className="mr-1" />
              <span className="text-xs">ESTIMATED COMPLETION</span>
            </div>
            <p className="text-sm font-medium">{timelineEstimate.eta}</p>
          </div>
        </div>

        <div className="bg-background p-3 rounded-md shadow-sm">
          <h5 className="text-sm font-medium mb-1">Estimated Effort</h5>
          <p className="text-sm">{timelineEstimate.taskInfo.hoursNeeded} hours</p>
        </div>

        <div className="bg-background p-3 rounded-md shadow-sm">
          <h5 className="text-sm font-medium mb-1">Queue Position</h5>
          <p className="text-sm">#{timelineEstimate.queuePosition + 1} in queue</p>
        </div>
      </div>

      <div className="bg-background p-3 rounded-md shadow-sm">
        <h5 className="text-sm font-medium mb-2">Working Hours</h5>
        <p className="text-sm">
          Work is performed between {timelineEstimate.workingHoursInfo.start} and {timelineEstimate.workingHoursInfo.end}.
          Tasks are processed during these hours only.
        </p>
      </div>

      {timelineEstimate.taskInfo.isOverdue && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md shadow-sm">
          <div className="flex items-center text-yellow-700 mb-1">
            <AlertTriangle size={14} className="mr-1" />
            <span className="text-xs font-medium">ATTENTION</span>
          </div>
          <p className="text-sm text-yellow-700">
            This task may take longer than expected. Consider adjusting priority or complexity.
          </p>
        </div>
      )}
    </div>
  );
};
