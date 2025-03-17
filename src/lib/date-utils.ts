
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";

export function formatDate(date: string | Date): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, "MMM d, yyyy");
}

export function formatDateTime(date: string | Date): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, "MMM d, yyyy h:mm a");
}

export function formatDistanceToNowShort(date: string | Date): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

/**
 * Format a duration from either a PostgreSQL interval, number (minutes), 
 * or string (HH:MM:SS) to a human-readable format.
 */
export function formatDuration(duration: string | number): string {
  // Handle numeric duration (in minutes)
  if (typeof duration === 'number') {
    const hours = Math.floor(duration / 60);
    const minutes = Math.floor(duration % 60);
    
    if (hours === 0 && minutes === 0) {
      return "immediate";
    }
    
    let result = "";
    if (hours > 0) {
      result += `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      if (result) result += " ";
      result += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    return result;
  }
  
  // Check if it's a PostgreSQL interval object (from Supabase)
  if (duration && typeof duration === 'object' && 'hours' in (duration as any)) {
    const intervalObj = duration as any;
    const hours = intervalObj.hours || 0;
    const minutes = intervalObj.minutes || 0;
    
    if (hours === 0 && minutes === 0) {
      return "immediate";
    }
    
    let result = "";
    if (hours > 0) {
      result += `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      if (result) result += " ";
      result += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    return result;
  }
  
  // Handle PostgreSQL interval format: "HH:MM:SS" or "X days HH:MM:SS"
  if (typeof duration === 'string' && (duration.includes(':') || duration.includes('day'))) {
    let days = 0;
    let hours = 0;
    let minutes = 0;
    
    // Extract days if present
    if (duration.includes('day')) {
      const dayMatch = duration.match(/(\d+) day/);
      if (dayMatch) {
        days = parseInt(dayMatch[1]);
      }
    }
    
    // Extract time component
    const timeMatch = duration.match(/(\d+):(\d+):(\d+)/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1]) + (days * 24);
      minutes = parseInt(timeMatch[2]);
    } else {
      // Try to handle other formats
      const hoursMatch = duration.match(/(\d+) hour/);
      const minutesMatch = duration.match(/(\d+) minute/);
      
      if (hoursMatch) hours = parseInt(hoursMatch[1]);
      if (minutesMatch) minutes = parseInt(minutesMatch[1]);
    }
    
    if (hours === 0 && minutes === 0) {
      return "immediate";
    }
    
    let result = "";
    if (hours > 0) {
      result += `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      if (result) result += " ";
      result += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    return result;
  }
  
  // Handle string format duration: "HH:MM:SS"
  const match = typeof duration === 'string' && duration.match(/(\d+):(\d+):(\d+)/);
  if (!match) return "unknown duration";
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  
  if (hours === 0 && minutes === 0) {
    return "immediate";
  }
  
  let result = "";
  if (hours > 0) {
    result += `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    if (result) result += " ";
    result += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  return result;
}

// Format timeline dates in the specific format we need
export function formatTimelineTime(date: string | Date | null): string {
  if (!date) return "";
  try {
    const parsedDate = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(parsedDate)) return "";
    return format(parsedDate, "haaa, MMM d").toLowerCase();
  } catch (e) {
    return "";
  }
}

/**
 * Format hour differences for timeline display
 * Handles PostgreSQL intervals and string representations
 */
export function formatHourDifference(hours: number | null | string | object): string {
  if (hours === null) return "";
  
  // If it's a PostgreSQL interval object from Supabase
  if (typeof hours === 'object' && hours !== null && 'hours' in (hours as any)) {
    const intervalObj = hours as any;
    const hourValue = intervalObj.hours || 0;
    const minuteValue = intervalObj.minutes || 0;
    // Fix the arithmetic operation by ensuring we're working with numbers
    const formattedHours = Number(hourValue) + (Number(minuteValue) / 60);
    
    // Round to one decimal place if not a whole number
    const displayValue = Number.isInteger(formattedHours) 
      ? formattedHours 
      : Math.round(formattedHours * 10) / 10;
    
    return `${displayValue} Hrs`;
  }
  
  // If it's a PostgreSQL interval string, extract the hours
  if (typeof hours === 'string') {
    // Try to extract hours from formats like "2:30:00" or "2 hours 30 mins" or PostgreSQL interval
    const hourMatch = hours.match(/(\d+):(\d+):(\d+)/);
    if (hourMatch) {
      const extractedHours = parseInt(hourMatch[1]);
      const extractedMinutes = parseInt(hourMatch[2]);
      const hourValue = extractedHours + (extractedMinutes / 60);
      const formattedHours = Number.isInteger(hourValue) ? hourValue : Math.round(hourValue * 10) / 10;
      return `${formattedHours} Hrs`;
    } else {
      const simpleHourMatch = hours.match(/(\d+) hour/);
      if (simpleHourMatch) {
        return `${parseInt(simpleHourMatch[1])} Hrs`;
      } else {
        return hours; // Return the original string if we can't parse it
      }
    }
  }
  
  if (isNaN(Number(hours))) return "";
  
  // Round to one decimal place if not a whole number
  const formattedHours = Number.isInteger(hours) ? hours : Math.round(hours * 10) / 10;
  
  return `${formattedHours} Hrs`;
}

// New function to get time status based on start and eta times
export function getTimeStatusInfo(start: string | null, eta: string | null): {
  status: string;
  statusClass: string;
} {
  if (!start || !eta) return { status: 'Not scheduled', statusClass: 'text-gray-500' };
  
  try {
    const startDate = parseISO(start);
    const etaDate = parseISO(eta);
    
    if (!isValid(startDate) || !isValid(etaDate)) {
      return { status: 'Invalid dates', statusClass: 'text-gray-500' };
    }
    
    const now = new Date();
    
    // Task hasn't started yet
    if (startDate > now) {
      return { status: 'Upcoming', statusClass: 'text-blue-500' };
    }
    
    // Task is in progress
    if (now < etaDate) {
      return { status: 'In Progress', statusClass: 'text-green-500' };
    }
    
    // Task is overdue
    return { status: 'Overdue', statusClass: 'text-amber-500' };
  } catch (e) {
    return { status: 'Error parsing dates', statusClass: 'text-red-500' };
  }
}

// Function to check if a date is valid
export function isValidDate(dateString: string | null): boolean {
  if (!dateString) return false;
  try {
    const date = parseISO(dateString);
    return isValid(date);
  } catch (e) {
    return false;
  }
}
