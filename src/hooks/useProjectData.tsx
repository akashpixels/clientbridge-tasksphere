
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { format } from "date-fns";
import { intervalToHours } from "@/lib/date-utils";
import { MonthlyUsage } from "@/types/usage";

export const useProjectData = (projectId: string | undefined) => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Helper function to fetch monthly usage data
  const fetchMonthlyUsage = async (projectId: string | undefined, monthYear: string): Promise<MonthlyUsage | null> => {
    if (!projectId) return null;
    
    try {
      const { data: usageData, error: usageError } = await supabase
        .from('subscription_usage')
        .select('allocated_duration, used_duration')
        .eq('project_id', projectId)
        .eq('billing_period', monthYear)
        .maybeSingle();

      if (usageError) {
        console.error('Error fetching usage data:', usageError);
      }

      if (usageData) {
        return {
          allocated_duration: intervalToHours(usageData.allocated_duration),
          used_duration: intervalToHours(usageData.used_duration)
        };
      }
      
      // Fallback calculation
      return {
        allocated_duration: 0,
        used_duration: 0
      };
    } catch (error) {
      console.error('Error in fetchMonthlyUsage:', error);
      return null;
    }
  };

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId, selectedMonth],
    queryFn: async () => {
      if (!projectId) return null;
      
      console.log('Fetching project details for ID:', projectId, 'for month:', selectedMonth);
      
      // Fetch base project data with relationships
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client_admin:client_admins(
            id,
            business_name,
            user_profiles(
              first_name,
              last_name
            )
          ),
          status:task_statuses(name, color_hex),
          project_subscriptions(
            id,
            subscription_status,
            allocated_duration,
            next_renewal_date
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        throw error;
      }
      
      // Project data successfully fetched
      console.log('Project base data fetched:', data);
      
      // Get usage data for the selected month
      const usageData = await fetchMonthlyUsage(projectId, selectedMonth);
      console.log('Usage data for selected month:', usageData);
      
      // Construct the enhanced project object
      const projectData = data;
      const enhancedProject = {
        ...projectData,
        project_subscriptions: projectData.project_subscriptions?.map(subscription => ({
          ...subscription,
          // Use hours data from usage calculation if available, fallback to subscription data
          allocated_duration: usageData?.allocated_duration ?? subscription.allocated_duration,
          actual_duration: usageData?.used_duration ?? 0
        }))
      };
      
      return enhancedProject;
    },
    enabled: !!projectId,
  });

  return {
    project,
    isLoading,
    error,
    selectedMonth,
    setSelectedMonth
  };
};
