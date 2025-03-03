
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
