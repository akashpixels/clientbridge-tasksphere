
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { MonthlyUsage } from '@/types/usage';
import { toast } from '@/hooks/use-toast';

interface UseMonthlyUsageOptions {
  projectId?: string;
  refreshInterval?: number; // milliseconds
  autoRefresh?: boolean;
}

interface UseMonthlyUsageReturn {
  loading: boolean;
  error: string | null;
  usage: MonthlyUsage | null;
  usagePercentage: number;
  formattedAllocated: string;
  formattedUsed: string;
  refresh: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage monthly usage for a project
 */
export function useMonthlyUsage({
  projectId,
  refreshInterval = 60000, // Default to 1 minute
  autoRefresh = false
}: UseMonthlyUsageOptions): UseMonthlyUsageReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<MonthlyUsage | null>(null);
  
  // Formats a duration in seconds to a human-readable string
  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return "0h";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };
  
  // Calculate the usage percentage
  const calculatePercentage = (allocated: number, used: number): number => {
    if (allocated === 0) return 0;
    return Math.min(Math.round((used / allocated) * 100), 100);
  };
  
  // Parse interval string like "2 hours 30 mins" to seconds
  const parseInterval = (intervalStr: string): number => {
    try {
      // Handle PostgreSQL interval format
      const hoursMatch = intervalStr.match(/(\d+)\s*(?:hours|hour)/i);
      const minsMatch = intervalStr.match(/(\d+)\s*(?:mins|min)/i);
      const secsMatch = intervalStr.match(/(\d+)\s*(?:secs|sec)/i);
      
      const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
      const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
      const secs = secsMatch ? parseInt(secsMatch[1], 10) : 0;
      
      return (hours * 3600) + (mins * 60) + secs;
    } catch (e) {
      console.error("Error parsing interval:", e);
      return 0;
    }
  };
  
  // Fetch usage data from the Supabase Edge Function
  const fetchUsage = async (): Promise<void> => {
    if (!projectId) {
      setError("Project ID is required");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('calculate-monthly-usage', {
        body: { projectId }
      });
      
      if (error) {
        throw new Error(error.message || "Failed to fetch usage data");
      }
      
      if (data) {
        // Parse interval strings to seconds for easier processing
        const allocatedSeconds = parseInterval(data.allocated_duration as string);
        const usedSeconds = parseInterval(data.used_duration as string);
        
        setUsage({
          allocated_duration: allocatedSeconds,
          used_duration: usedSeconds
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: `Failed to load monthly usage: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Effect to fetch data on mount and when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchUsage();
    }
  }, [projectId]);
  
  // Set up auto refresh if enabled
  useEffect(() => {
    if (!autoRefresh || !projectId) return;
    
    const intervalId = setInterval(() => {
      fetchUsage();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, projectId]);
  
  const formattedAllocated = usage ? formatDuration(usage.allocated_duration) : "-";
  const formattedUsed = usage ? formatDuration(usage.used_duration) : "-";
  const usagePercentage = usage ? calculatePercentage(usage.allocated_duration, usage.used_duration) : 0;
  
  return {
    loading,
    error,
    usage,
    usagePercentage,
    formattedAllocated,
    formattedUsed,
    refresh: fetchUsage
  };
}
