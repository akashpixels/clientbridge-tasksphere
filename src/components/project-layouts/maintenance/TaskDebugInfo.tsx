
import React from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface TaskDebugInfoProps {
  taskId: string;
}

interface EtaDebugInfo {
  task_id: string;
  priority_level_id: number;
  priority_name: string;
  start_delay: string;
  base_time: string;
  task_spacing: string;
  est_start: string;
  est_end: string;
  created_at: string;
  est_duration: string;
  total_blocked_duration: string | null;
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
      // @ts-ignore - We know this function exists but TypeScript doesn't
      const { data, error } = await supabase.rpc('get_eta_debug_info', { 
        p_task_id: taskId
      });
      
      if (error) {
        console.error('Error fetching task debug info:', error);
        throw error;
      }
      
      return data as unknown as EtaDebugInfo;
    },
    enabled: !!taskId,
  });

  if (isLoading) {
    return <div className="p-2 text-xs text-muted-foreground">Loading debug data...</div>;
  }

  if (error || !data) {
    return <div className="p-2 text-xs text-red-500">Error loading debug data</div>;
  }

  return (
    <Card className="p-3 bg-slate-50 text-xs space-y-2 mt-1">
      <h4 className="font-semibold text-sm border-b pb-1">ETA Calculation Debug</h4>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="font-medium">Priority:</span>{" "}
          {data.priority_name} (ID: {data.priority_level_id})
        </div>
        <div>
          <span className="font-medium">Start Delay:</span>{" "}
          {formatInterval(data.start_delay)}
        </div>
        <div>
          <span className="font-medium">Base Time:</span>{" "}
          {formatIsoDate(data.base_time)}
        </div>
        <div>
          <span className="font-medium">Task Spacing:</span>{" "}
          {formatInterval(data.task_spacing)}
        </div>
        <div>
          <span className="font-medium">Created At:</span>{" "}
          {formatIsoDate(data.created_at)}
        </div>
        <div>
          <span className="font-medium">Est Duration:</span>{" "}
          {formatInterval(data.est_duration)}
        </div>
        <div>
          <span className="font-medium">Est Start:</span>{" "}
          <span className="bg-yellow-100 px-1">{formatIsoDate(data.est_start)}</span>
        </div>
        <div>
          <span className="font-medium">Est End:</span>{" "}
          <span className="bg-yellow-100 px-1">{formatIsoDate(data.est_end)}</span>
        </div>
        <div>
          <span className="font-medium">Blocked Duration:</span>{" "}
          {formatInterval(data.total_blocked_duration)}
        </div>
      </div>
    </Card>
  );
};
