
/**
 * Formats a date into a human-readable string like "January 1, 2023"
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Formats a date into a shorter human-readable string like "Jan 1, 2023"
 */
export const formatShortDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats a date into a string like "1/1/2023"
 */
export const formatShorterDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
};

/**
 * Formats a date into a string like "1/1/2023 12:00 AM"
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
};

/**
 * Formats a duration (either a string, number of hours, or PostgreSQL interval object) into a human-readable format
 */
export const formatDuration = (duration: any): string => {
  if (!duration) return "0 minutes";
  
  // If it's a PostgreSQL interval object (as returned from the database)
  if (typeof duration === 'object' && duration !== null) {
    if ('hours' in duration || 'minutes' in duration || 'seconds' in duration || 'days' in duration) {
      const days = duration.days || 0;
      const hours = duration.hours || 0;
      const minutes = duration.minutes || 0;
      
      if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''}${hours > 0 ? `, ${hours} hour${hours > 1 ? 's' : ''}` : ''}`;
      }
      
      if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? `, ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
      }
      
      if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
      
      return "less than a minute";
    }
  }
  
  // Handle PostgreSQL interval string format like "1 day 2 hours 30 minutes"
  if (typeof duration === 'string') {
    // Try to extract components from the PostgreSQL interval string
    const daysMatch = duration.match(/(\d+)\s+day/i);
    const hoursMatch = duration.match(/(\d+)\s+hour/i);
    const minutesMatch = duration.match(/(\d+)\s+min/i);
    const secondsMatch = duration.match(/(\d+)\s+sec/i);
    
    const days = daysMatch ? parseInt(daysMatch[1]) : 0;
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}${hours > 0 ? `, ${hours} hour${hours > 1 ? 's' : ''}` : ''}`;
    }
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? `, ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
    }
    
    if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    if (seconds > 0) {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
    
    // If none of the above patterns matched but it's a non-empty string
    if (duration.trim()) {
      return duration; // Return the original string
    }
    
    return "less than a minute";
  }
  
  // Treat as a number of hours if it's a number
  if (typeof duration === 'number') {
    if (duration < 1/60) return "less than a minute";
    if (duration < 1) return `${Math.round(duration * 60)} minutes`;
    if (duration === 1) return "1 hour";
    if (duration < 24) return `${Math.floor(duration)} hours${duration % 1 > 0 ? `, ${Math.round((duration % 1) * 60)} minutes` : ''}`;
    
    const days = Math.floor(duration / 24);
    const hours = Math.floor(duration % 24);
    
    if (hours === 0) return `${days} day${days > 1 ? 's' : ''}`;
    return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return "Unknown duration";
};

/**
 * Formats the time since a given date, e.g., "2 hours ago"
 */
export const formatTimeAgo = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }

  return formatShortDate(d);
};

/**
 * Formats the time difference between two dates in hours.
 */
export const formatHourDifference = (start: Date | string | null, end: Date | string | null): string => {
  if (!start || !end) return "N/A";
  
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  
  const diffInMs = endDate.getTime() - startDate.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  
  if (diffInHours < 0) return "N/A"; // Invalid time difference
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.round(diffInHours * 60);
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}`;
  }
  
  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    const minutes = Math.round((diffInHours - hours) * 60);
    
    if (minutes === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const days = Math.floor(diffInHours / 24);
  const hours = Math.floor(diffInHours % 24);
  
  if (hours === 0) return `${days} day${days !== 1 ? 's' : ''}`;
  return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
};

/**
 * Convert interval object to hours as number
 */
export const intervalToHours = (interval: any): number => {
  if (!interval) return 0;
  
  // If it's a PostgreSQL interval object
  if (typeof interval === 'object' && interval !== null) {
    if ('hours' in interval || 'minutes' in interval || 'seconds' in interval || 'days' in interval) {
      const days = interval.days || 0;
      const hours = interval.hours || 0;
      const minutes = interval.minutes || 0;
      const seconds = interval.seconds || 0;
      
      return days * 24 + hours + minutes / 60 + seconds / 3600;
    }
  }
  
  // If it's an interval string
  if (typeof interval === 'string') {
    const daysMatch = interval.match(/(\d+)\s+day/i);
    const hoursMatch = interval.match(/(\d+)\s+hour/i);
    const minutesMatch = interval.match(/(\d+)\s+min/i);
    const secondsMatch = interval.match(/(\d+)\s+sec/i);
    
    const days = daysMatch ? parseInt(daysMatch[1]) : 0;
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;
    
    return days * 24 + hours + minutes / 60 + seconds / 3600;
  }
  
  // If it's a number, assume it's already in hours
  if (typeof interval === 'number') {
    return interval;
  }
  
  return 0;
};
