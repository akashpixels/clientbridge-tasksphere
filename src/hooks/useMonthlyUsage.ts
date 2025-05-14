
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { MonthlyUsage } from "@/types/usage";
import { toast } from "@/components/ui/use-toast";

export function useMonthlyUsage(projectId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<MonthlyUsage | null>(null);
  
  useEffect(() => {
    async function fetchMonthlyUsage() {
      try {
        setLoading(true);
        setError(null);
        
        // Get current month and year
        const now = new Date();
        const currentPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        
        // Fetch the subscription usage data
        const { data, error } = await supabase
          .from('subscription_usage')
          .select(`
            allocated_duration,
            used_duration,
            metadata
          `)
          .eq('project_id', projectId)
          .eq('billing_period', currentPeriod)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Record not found - try calling the edge function to generate one
            await calculateUsage(projectId);
          } else {
            console.error('Error fetching monthly usage:', error);
            setError(`Failed to load usage data: ${error.message}`);
          }
          return;
        }
        
        if (data) {
          // Parse the metadata to get values in seconds for consistent usage
          let allocatedSeconds = 0;
          let usedSeconds = 0;
          
          if (data.metadata && typeof data.metadata === 'object') {
            allocatedSeconds = data.metadata.allocated_seconds || 0;
            usedSeconds = data.metadata.used_seconds || 0;
          }
          
          setUsageData({
            allocated_duration: allocatedSeconds,
            used_duration: usedSeconds
          });
        }
      } catch (err) {
        console.error('Unexpected error fetching monthly usage:', err);
        setError('An unexpected error occurred while loading usage data');
      } finally {
        setLoading(false);
      }
    }
    
    async function calculateUsage(projectId: string) {
      try {
        // Call the edge function to calculate usage for this project
        const response = await fetch(`https://ibsarezwhabbbbirdbnk.supabase.co/functions/v1/calculate-monthly-usage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`
          },
          body: JSON.stringify({ projectId })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error calculating usage');
        }
        
        // Fetch the updated data
        const { data, error } = await supabase
          .from('subscription_usage')
          .select(`
            allocated_duration,
            used_duration,
            metadata
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          console.error('Error fetching monthly usage after calculation:', error);
          setError(`Failed to load updated usage data: ${error.message}`);
          return;
        }
        
        if (data) {
          // Parse the metadata to get values in seconds for consistent usage
          let allocatedSeconds = 0;
          let usedSeconds = 0;
          
          if (data.metadata && typeof data.metadata === 'object') {
            allocatedSeconds = data.metadata.allocated_seconds || 0;
            usedSeconds = data.metadata.used_seconds || 0;
          }
          
          setUsageData({
            allocated_duration: allocatedSeconds,
            used_duration: usedSeconds
          });
        }
      } catch (err) {
        console.error('Error calculating monthly usage:', err);
        toast({
          title: "Error calculating usage",
          description: err.message,
          variant: "destructive"
        });
      }
    }
    
    if (projectId) {
      fetchMonthlyUsage();
    }
  }, [projectId]);
  
  // Format the raw usage values into human-readable strings
  const formatUsage = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '0h';
    }
  };
  
  return {
    loading,
    error,
    usageData,
    formattedAllocated: usageData ? formatUsage(usageData.allocated_duration) : 'N/A',
    formattedUsed: usageData ? formatUsage(usageData.used_duration) : 'N/A',
    usagePercentage: usageData && usageData.allocated_duration > 0 
      ? Math.min(100, Math.round((usageData.used_duration / usageData.allocated_duration) * 100))
      : 0
  };
}
