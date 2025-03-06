
import { format, formatDistanceToNow, parseISO } from "date-fns";

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

export function formatDuration(duration: string): string {
  // Duration format: "HH:MM:SS"
  const match = duration.match(/(\d+):(\d+):(\d+)/);
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
    return format(parsedDate, "haaa, MMM d").toLowerCase();
  } catch (e) {
    return typeof date === "string" ? date : "";
  }
}

// Format hour differences for timeline display
export function formatHourDifference(hours: number | null): string {
  if (hours === null || isNaN(Number(hours))) return "";
  
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
