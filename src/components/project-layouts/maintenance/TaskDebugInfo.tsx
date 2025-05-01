
import React from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

interface TaskDebugInfoProps {
  taskId: string;
}

interface EtaDebugInfo {
  task_id: string;
  project_id: string;
  queue_position?: number;
  priority_level_id: number;
  priority_name: string;
  start_delay: string;
  lane_capacity: number;
  project_task_count: number;
  created_at: string;
  base_time: string;
  gap_time: string;
  spent_time: string;
  delta: string;
  task_spacing: string;
  est_duration: string;
  total_blocked_duration: string | null;
  est_start: string;
  est_end: string;
  working_days: string[];
  working_start_time: string;
  working_end_time: string;
  error?: string;
}

const formatIsoDate = (date: string | null) => {
  if (!date) return "N/A";
  try {
    return format(new Date(date), "yyyy-MM-dd HH:mm:ss");
  } catch (e) {
    return date;
  }
};

const formatInterval = (interval: string | null) => {
  if (!interval) return "N/A";
  return interval;
};

export const TaskDebugInfo = ({ taskId }: TaskDebugInfoProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['taskDebug', taskId],
    queryFn: async () => {
      console.log(`Fetching debug info for task: ${taskId}`);
      
      // @ts-ignore - We know this function exists but TypeScript doesn't
      const { data, error } = await supabase.rpc('get_eta_debug_info', { 
        p_task_id: taskId
      });
      
      if (error) {
        console.error('Error fetching task debug info:', error);
        throw error;
      }
      
      console.log('Debug info received:', data);
      
      if (data.error) {
        console.error('Error in debug data:', data.error);
        throw new Error(data.error);
      }
      
      return data as unknown as EtaDebugInfo;
    },
    enabled: !!taskId,
    retry: 1 // Only retry once to avoid excessive calls on permanent errors
  });

  if (isLoading) {
    return <div className="p-2 text-xs text-muted-foreground">Loading debug data...</div>;
  }

  if (error) {
    console.error('Rendering error state with:', error);
    return (
      <div className="p-2 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        <span>Error loading debug data: {(error as Error).message}</span>
      </div>
    );
  }

  if (!data) {
    return <div className="p-2 text-xs text-red-500">No debug data available</div>;
  }

  return (
    <Card className="p-3 bg-slate-50 text-xs space-y-2 mt-1">
      <h4 className="font-semibold text-sm border-b pb-1">ETA Calculation Debug</h4>
      
      <div className="space-y-4">
        {/* Task and Priority Information */}
        <div>
          <h5 className="font-medium text-xs mb-1 text-gray-700">Task & Priority</h5>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Priority:</span>{" "}
              {data.priority_name || 'N/A'} (ID: {data.priority_level_id})
            </div>
            <div>
              <span className="font-medium">Start Delay:</span>{" "}
              {formatInterval(data.start_delay)}
            </div>
            <div>
              <span className="font-medium">Queue Position:</span>{" "}
              {data.queue_position || "N/A"}
            </div>
            <div>
              <span className="font-medium">Created At:</span>{" "}
              {formatIsoDate(data.created_at)}
            </div>
          </div>
        </div>
        
        {/* Lane Information */}
        <div>
          <h5 className="font-medium text-xs mb-1 text-gray-700">Lane Information</h5>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Lane Capacity:</span>{" "}
              {data.lane_capacity}
            </div>
            <div>
              <span className="font-medium">Project Task Count:</span>{" "}
              {data.project_task_count}
            </div>
          </div>
        </div>
        
        {/* Calculation Steps */}
        <div>
          <h5 className="font-medium text-xs mb-1 text-gray-700">Calculation Steps</h5>
          <div className="grid grid-cols-1 gap-1">
            <div className="grid grid-cols-2 gap-1">
              <div>
                <span className="font-medium">Base Time:</span>{" "}
                <span className="bg-blue-100 px-1">{formatIsoDate(data.base_time)}</span>
              </div>
              <div>
                <span className="font-medium">Est Duration:</span>{" "}
                {formatInterval(data.est_duration)}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div>
                <span className="font-medium">Gap Time:</span>{" "}
                {formatInterval(data.gap_time)}
              </div>
              <div>
                <span className="font-medium">Spent Time:</span>{" "}
                {formatInterval(data.spent_time)}
              </div>
              <div>
                <span className="font-medium">Delta:</span>{" "}
                {formatInterval(data.delta)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div>
                <span className="font-medium">Task Spacing:</span>{" "}
                <span className="bg-violet-100 px-1">{formatInterval(data.task_spacing)}</span>
              </div>
              <div>
                <span className="font-medium">Blocked Duration:</span>{" "}
                {formatInterval(data.total_blocked_duration)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Final Results */}
        <div>
          <h5 className="font-medium text-xs mb-1 text-gray-700">Final Results</h5>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Est Start:</span>{" "}
              <span className="bg-yellow-100 px-1">{formatIsoDate(data.est_start)}</span>
            </div>
            <div>
              <span className="font-medium">Est End:</span>{" "}
              <span className="bg-yellow-100 px-1">{formatIsoDate(data.est_end)}</span>
            </div>
          </div>
        </div>
        
        {/* Working Hours Configuration */}
        <div className="mt-2">
          <h5 className="font-medium text-xs mb-1 text-gray-700">Working Hours Config</h5>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <span className="font-medium">Working Days:</span>{" "}
              <span className="text-gray-600">{Array.isArray(data.working_days) ? data.working_days.join(", ") : "N/A"}</span>
            </div>
            <div>
              <span className="font-medium">Start Time:</span>{" "}
              <span className="text-gray-600">{data.working_start_time || "N/A"}</span>
            </div>
            <div>
              <span className="font-medium">End Time:</span>{" "}
              <span className="text-gray-600">{data.working_end_time || "N/A"}</span>
            </div>
          </div>
        </div>
        
        {/* Debug History Link */}
        <div className="text-right pt-1">
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              console.log("Task ETA history would be shown here");
              // Future enhancement: Show modal with ETA debug history
            }} 
            className="text-xs text-blue-600 hover:underline"
          >
            View ETA History
          </a>
        </div>
      </div>
    </Card>
  );
};
