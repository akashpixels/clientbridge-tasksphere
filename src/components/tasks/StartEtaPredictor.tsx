
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimelineTime, formatHourDifference } from "@/lib/date-utils";
import { supabase } from "@/integrations/supabase/client";

interface StartEtaPredictorProps {
  taskTypeId?: number | null;
  priorityLevelId?: number | null;
  complexityLevelId?: number | null;
  projectId?: string;
  taskId?: string;
  compact?: boolean;
  activeTaskCount?: number | null;
}

export const StartEtaPredictor = ({
  taskTypeId,
  priorityLevelId = 2,
  complexityLevelId = 3,
  projectId,
  taskId,
  compact = false,
  activeTaskCount = null
}: StartEtaPredictorProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [timelineData, setTimelineData] = useState<{
    startTime: string | null;
    eta: string | null;
    hoursNeeded: string | null;
  }>({ startTime: null, eta: null, hoursNeeded: null });

  useEffect(() => {
    const fetchTimelineData = async () => {
      setIsLoading(true);
      
      try {
        let query;
        
        // If we have a specific taskId, fetch that task's timeline data
        if (taskId) {
          query = supabase
            .from('task_timeline')
            .select('start_time, eta, hours_needed')
            .eq('task_id', taskId)
            .single();
        } 
        // If we don't have a taskId but have a projectId and priorityLevel, 
        // we can make a prediction for a new task
        else if (projectId && priorityLevelId) {
          // For new tasks, we need to know queue position and use similar calculations
          // This is a simplified approach - in a real app, you might have this logic in a function
          const { data: projectData } = await supabase
            .from('project_timeline')
            .select('active_task_count, max_concurrent_tasks')
            .eq('project_id', projectId)
            .single();
            
          const { data: priorityData } = await supabase
            .from('priority_levels')
            .select('time_to_start, multiplier')
            .eq('id', priorityLevelId)
            .single();
            
          const { data: complexityData } = await supabase
            .from('complexity_levels')
            .select('multiplier')
            .eq('id', complexityLevelId || 3)
            .single();
          
          const { data: taskTypeData } = await supabase
            .from('task_types')
            .select('base_duration')
            .eq('id', taskTypeId || 1)
            .single();
            
          // Handle the interval types from PostgreSQL
          const baseHours = taskTypeData?.base_duration || '1 hour';
          const hoursNeeded = baseHours;
          
          // Calculate start time based on priority and project capacity
          let startTime = new Date();
          if (priorityLevelId !== 1 && 
              (projectData?.active_task_count || 0) >= (projectData?.max_concurrent_tasks || 1)) {
            // Task will be queued - add delay based on priority
            // Convert PostgreSQL interval to JavaScript Date addition
            if (priorityData?.time_to_start) {
              const timeToStart = priorityData.time_to_start;
              
              // Try to extract minutes from the interval
              const minutesMatch = String(timeToStart).match(/(\d+) minutes?/);
              const hoursMatch = String(timeToStart).match(/(\d+) hours?/);
              
              if (minutesMatch) {
                startTime.setMinutes(startTime.getMinutes() + parseInt(minutesMatch[1]));
              } else if (hoursMatch) {
                startTime.setHours(startTime.getHours() + parseInt(hoursMatch[1]));
              }
            }
          }
          
          // Calculate ETA based on start time and hours needed
          let etaTime = new Date(startTime);
          
          // Try to parse the hours from the interval
          const hoursMatch = String(hoursNeeded).match(/(\d+)/);
          if (hoursMatch) {
            const hours = parseInt(hoursMatch[1]);
            etaTime.setHours(etaTime.getHours() + hours * (priorityData?.multiplier || 1));
          } else {
            // Default fallback
            etaTime.setHours(etaTime.getHours() + 2);
          }
          
          setTimelineData({
            startTime: startTime.toISOString(),
            eta: etaTime.toISOString(),
            hoursNeeded: hoursNeeded
          });
          setIsLoading(false);
          return;
        } else {
          // Default fallback if we don't have enough data
          const now = new Date();
          const etaTime = new Date(now);
          etaTime.setHours(etaTime.getHours() + 2); // Default 2 hours
          
          setTimelineData({
            startTime: now.toISOString(),
            eta: etaTime.toISOString(),
            hoursNeeded: '2 hours'
          });
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching timeline data:", error);
          setIsLoading(false);
          return;
        }
        
        if (data) {
          setTimelineData({
            startTime: data.start_time,
            eta: data.eta,
            hoursNeeded: data.hours_needed
          });
        }
      } catch (error) {
        console.error("Error in fetchTimelineData:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimelineData();
  }, [taskId, projectId, priorityLevelId, complexityLevelId, taskTypeId]);

  const getTimeBetweenNodes = () => {
    return formatHourDifference(timelineData.hoursNeeded);
  };

  const formatTimeWithLineBreak = (timeString: string | null): React.ReactNode => {
    if (!timeString) return "";
    const parts = timeString.split(', ');
    if (parts.length !== 2) return timeString;
    return (
      <>
        {parts[0]}<br />{parts[1]}
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="pt-7 pb-4">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 bg-background z-10">
      <div className="pt-7 pb-0">
        <div className="relative">
          <div className="absolute top-[-8px] left-[60%] -translate-x-1/2 text-[9px] text-gray-400 font-medium">
            {getTimeBetweenNodes()}
          </div>
          
          <div className="flex justify-between items-center mb-2 pt-1 pb-1 relative min-h-[32px]">
            <div className="absolute top-[16px] left-0 right-0 h-[1px] bg-gray-300 z-0"></div>
            
            <div className="flex flex-col items-start z-10 pl-0">
              <div className="relative h-[20px] flex items-center">
                <div className="w-[1px] h-[13px] bg-gray-300 absolute left-0 top-[-8px]"></div>
              </div>
            </div>
            
            <div className="absolute left-[35%] -translate-x-1/2 z-10 flex flex-col items-center">
              <div className="h-[22px] w-[40px] rounded-full border border-gray-200 bg-white flex items-center justify-center text-[10px] font-medium text-gray-600">
                Start
              </div>
              <div className="text-[9px] mt-0.5 text-gray-500 text-center min-h-[24px]">
                {formatTimeWithLineBreak(formatTimelineTime(timelineData.startTime))}
              </div>
            </div>
            
            <div className="flex flex-col items-end z-10 pr-0">
              <div className="relative h-[20px] flex items-center">
                <div className="h-[22px] w-[35px] rounded-full border border-gray-200 bg-white flex items-center justify-center text-[10px] font-medium text-gray-600 absolute right-0">
                  ETA
                </div>
              </div>
              <div className="text-[9px] mt-0.5 text-gray-500 text-right min-h-[24px]">
                {formatTimeWithLineBreak(formatTimelineTime(timelineData.eta))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
