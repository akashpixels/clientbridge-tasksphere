
import { addDays, addHours, addMinutes, differenceInHours, format } from "date-fns";

export interface TimelineEstimate {
  currentTime: string;
  startTime: string | null;
  eta: string | null;
  queuePosition: number;
  taskInfo: {
    hoursNeeded: number | null;
    timeToStart: number | null;
    isOverdue: boolean;
  };
}

export interface TaskTypeData {
  id: number;
  name: string;
  base_duration: string | null;
  description?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PriorityLevelData {
  id: number;
  name: string;
  description?: string;
  time_to_start: string | null;
  multiplier: number | null;
  color?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ComplexityLevelData {
  id: number;
  name: string;
  multiplier: number;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const calculateTimelineEstimate = (
  taskType: TaskTypeData | null,
  priorityLevel: PriorityLevelData | null,
  complexityLevel: ComplexityLevelData | null,
  queuePosition: number
): TimelineEstimate => {
  try {
    const now = new Date();
    let startTime: Date | null = null;
    let eta: Date | null = null;
    let hoursNeeded: number | null = null;
    let timeToStart: number | null = null;
    let isOverdue = false;

    if (taskType && priorityLevel && complexityLevel) {
      startTime = new Date();

      if (priorityLevel.time_to_start) {
        const timeToStartMatch = priorityLevel.time_to_start.match(/(\d+):(\d+):(\d+)/);
        if (timeToStartMatch) {
          const hours = parseInt(timeToStartMatch[1]);
          const minutes = parseInt(timeToStartMatch[2]);
          timeToStart = hours + minutes / 60;
          startTime = addHours(startTime, hours);
          startTime = addMinutes(startTime, minutes);
        }
      }

      startTime = addMinutes(startTime, queuePosition * 30);

      const currentHour = startTime.getHours();
      if (currentHour < 10) {
        startTime.setHours(10, 0, 0, 0);
      } else if (currentHour >= 18) {
        startTime = addDays(startTime, 1);
        startTime.setHours(10, 0, 0, 0);
      }

      hoursNeeded = 1;
      if (taskType.base_duration) {
        const baseDurationMatch = taskType.base_duration.match(/(\d+):(\d+):(\d+)/);
        if (baseDurationMatch) {
          const hours = parseInt(baseDurationMatch[1]);
          const minutes = parseInt(baseDurationMatch[2]);
          hoursNeeded = hours + minutes / 60;
        }
      }

      if (priorityLevel.multiplier) {
        hoursNeeded *= priorityLevel.multiplier;
      }
      if (complexityLevel.multiplier) {
        hoursNeeded *= complexityLevel.multiplier;
      }

      eta = new Date(startTime);
      eta = addHours(eta, hoursNeeded);

      const etaHour = eta.getHours();
      const workingHoursInDay = 8;
      if (etaHour >= 18) {
        const hoursOver = etaHour - 18;
        const daysToAdd = Math.floor(hoursOver / workingHoursInDay) + 1;
        const remainingHours = hoursOver % workingHoursInDay;
        eta = addDays(eta, daysToAdd);
        eta.setHours(10 + remainingHours, eta.getMinutes(), 0, 0);
      }

      isOverdue = priorityLevel.id >= 4 && differenceInHours(eta, now) > 48;
    }

    return {
      currentTime: format(now, 'h:mm a'),
      startTime: startTime ? format(startTime, 'h:mm a, MMM d') : null,
      eta: eta ? format(eta, 'h:mm a, MMM d') : null,
      queuePosition,
      taskInfo: {
        hoursNeeded: hoursNeeded ? Math.round(hoursNeeded * 10) / 10 : null,
        timeToStart: timeToStart,
        isOverdue
      }
    };
  } catch (error) {
    console.error("Error calculating timeline:", error);
    const now = new Date();
    return {
      currentTime: format(now, 'h:mm a'),
      startTime: null,
      eta: null,
      queuePosition,
      taskInfo: {
        hoursNeeded: null,
        timeToStart: null,
        isOverdue: false
      }
    };
  }
};
