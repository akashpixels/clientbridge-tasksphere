
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  TimelineEstimate, 
  calculateTimelineEstimate, 
  TaskTypeData, 
  PriorityLevelData, 
  ComplexityLevelData 
} from "./timeline-utils";

interface TimelineDataProviderProps {
  taskTypeId?: number | null;
  priorityLevelId?: number | null;
  complexityLevelId?: number | null;
  projectId?: string;
  children: (props: {
    isLoading: boolean;
    timelineEstimate: TimelineEstimate | null;
    queuePosition: number;
  }) => React.ReactNode;
}

export const TimelineDataProvider: React.FC<TimelineDataProviderProps> = ({
  taskTypeId,
  priorityLevelId,
  complexityLevelId = 3,
  projectId,
  children
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [taskType, setTaskType] = useState<TaskTypeData | null>(null);
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevelData | null>(null);
  const [complexityLevel, setComplexityLevel] = useState<ComplexityLevelData | null>(null);
  const [queuePosition, setQueuePosition] = useState(0);
  const [timelineEstimate, setTimelineEstimate] = useState<TimelineEstimate | null>(null);

  useEffect(() => {
    const fetchTaskType = async () => {
      if (!taskTypeId) return;
      const {
        data,
        error
      } = await supabase.from('task_types').select('*').eq('id', taskTypeId).single();
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

  useEffect(() => {
    const fetchPriorityLevel = async () => {
      if (!priorityLevelId) return;
      const {
        data,
        error
      } = await supabase.from('priority_levels').select('*').eq('id', priorityLevelId).single();
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

  useEffect(() => {
    const fetchComplexityLevel = async () => {
      if (!complexityLevelId) return;
      const {
        data,
        error
      } = await supabase.from('complexity_levels').select('*').eq('id', complexityLevelId).single();
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

  useEffect(() => {
    const fetchQueuePosition = async () => {
      if (!projectId) return;
      const {
        count,
        error
      } = await supabase.from('tasks').select('*', {
        count: 'exact',
        head: true
      }).eq('project_id', projectId).in('current_status_id', [1, 2, 3]);

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

  useEffect(() => {
    const updateTimelineEstimate = () => {
      try {
        const estimate = calculateTimelineEstimate(
          taskType,
          priorityLevel,
          complexityLevel,
          queuePosition
        );
        setTimelineEstimate(estimate);
      } catch (error) {
        console.error("Error calculating timeline:", error);
      }
      setIsLoading(false);
    };

    setIsLoading(true);
    updateTimelineEstimate();
  }, [taskType, priorityLevel, complexityLevel, queuePosition]);

  return <>{children({ isLoading, timelineEstimate, queuePosition })}</>;
};
