
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskForm } from "./TaskForm";
import { useLayout } from "@/context/layout";
import { X, AlertCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Define a type for the task data that includes the formatted property
interface TaskData {
  id: string;
  task_code?: string;
  details: string;
  current_status_id: number;
  priority_level_id: number;
  actual_duration?: any;
  actual_duration_formatted?: string;
  is_onhold?: boolean;
  is_awaiting_input?: boolean;
  [key: string]: any; // Allow other properties
}

// Define a type for the ETA calculation debug data
interface ETADebugData {
  base_time: string | null;
  gap_time: string | null;
  delta: string | null;
  est_start: string | null;
  est_end: string | null;
}

// Helper function to format interval for display
const formatIntervalForDisplay = (intervalValue: any): string => {
  if (!intervalValue) return "0h";
  
  // Handle if intervalValue is already a number
  if (typeof intervalValue === 'number') {
    return intervalValue === 0 ? "0h" : `${intervalValue}h`;
  }
  
  // Convert PostgreSQL interval string formats to hours
  try {
    if (typeof intervalValue === 'string') {
      // Handle "HH:MM:SS" format
      if (intervalValue.includes(':')) {
        const parts = intervalValue.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const minutesAsHours = minutes / 60;
        return `${(hours + minutesAsHours).toFixed(1).replace(/\.0$/, '')}h`;
      }
      // Handle "X hours Y minutes" format
      else if (intervalValue.includes('hours') || intervalValue.includes('hour')) {
        const hoursMatch = intervalValue.match(/(\d+)\s+hours?/);
        const minutesMatch = intervalValue.match(/(\d+)\s+minutes?/);
        const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
        const minutesAsHours = minutes / 60;
        return `${(hours + minutesAsHours).toFixed(1).replace(/\.0$/, '')}h`;
      }
      // Try to parse as a raw number
      return `${parseFloat(intervalValue)}h`;
    }
    
    // Handle interval object format from PostgreSQL
    if (typeof intervalValue === 'object' && intervalValue !== null) {
      // Convert interval object to string and extract hours
      const stringValue = String(intervalValue);
      return formatIntervalForDisplay(stringValue);
    }
    
    return "0h";
  } catch (e) {
    console.error("Error formatting interval:", e, intervalValue);
    return "0h";
  }
};

export const TaskCreationSidebar = () => {
  const { toast } = useToast();
  const { id: projectId } = useParams<{ id: string; }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  const { closeRightSidebar } = useLayout();
  const [taskCreated, setTaskCreated] = useState(false);
  const [createdTaskData, setCreatedTaskData] = useState<TaskData | null>(null);
  const [etaDebugData, setEtaDebugData] = useState<ETADebugData | null>(null);
  const [etaCalculating, setEtaCalculating] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  // Get the queue position for current project tasks
  const fetchQueuePosition = async () => {
    if (!projectId) return;
    try {
      // Get the highest queue position for tasks in the project
      const { data, error } = await supabase
        .from('tasks')
        .select('queue_position')
        .eq('project_id', projectId)
        .order('queue_position', { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching queue position:", error);
        return;
      }
      
      // Set next queue position (1 more than the highest, or 1 if no tasks)
      const nextQueuePos = data && data.length > 0 && data[0].queue_position 
                          ? data[0].queue_position + 1 
                          : 1;
      setQueuePosition(nextQueuePos);
    } catch (error) {
      console.error("Error in fetchQueuePosition:", error);
    }
  };

  const fetchActiveTaskCount = async () => {
    if (!projectId) return;
    try {
      // Count active tasks directly from the tasks table
      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', projectId)
        .in('current_status_id', [2, 3, 4, 5, 6, 7]) // Active task statuses
        .is('completed_at', null); // Updated from task_completed_at to completed_at

      if (error) {
        console.error("Error fetching active tasks:", error);
        return;
      }
      
      setActiveTaskCount(data?.length || 0);
    } catch (error) {
      console.error("Error in fetchActiveTaskCount:", error);
    }
  };

  useEffect(() => {
    fetchActiveTaskCount();
    fetchQueuePosition();
  }, [projectId]);

  // Function to calculate ETA for debugging
  const calculateETA = async (formData: any) => {
    if (!projectId || !queuePosition) return;
    
    try {
      setEtaCalculating(true);
      
      // Get the task type and complexity to calculate est_duration
      const { data: durationData, error: durationError } = await supabase.rpc(
        'calculate_est_duration_helper',
        { 
          complexity_level_id: formData.complexity_level_id,
          task_type_id: formData.task_type_id 
        }
      );
      
      if (durationError) {
        console.error("Error calculating duration:", durationError);
        return;
      }
      
      // Calculate base_time
      const { data: baseTimeData, error: baseTimeError } = await supabase.rpc(
        'calculate_base_time',
        { 
          p_project_id: projectId,
          p_queue_pos: queuePosition 
        }
      );
      
      if (baseTimeError) {
        console.error("Error calculating base time:", baseTimeError);
        return;
      }
      
      // For demonstration, simulate gap_time as working hours between now and base_time
      const { data: gapTimeData, error: gapTimeError } = await supabase.rpc(
        'calculate_working_hours',
        {
          start_time: new Date().toISOString(),
          end_time: baseTimeData
        }
      );
      
      if (gapTimeError) {
        console.error("Error calculating gap time:", gapTimeError);
        return;
      }
      
      // Simulate calculating delta (priority_levels.start_delay - gap_time, minimum 30 min)
      // First get the start delay for this priority
      const { data: priorityData, error: priorityError } = await supabase
        .from('priority_levels')
        .select('start_delay')
        .eq('id', formData.priority_level_id)
        .single();
        
      if (priorityError) {
        console.error("Error fetching priority data:", priorityError);
        return;
      }
      
      // Calculate delta as max(start_delay - gap_time, 30min)
      const startDelay = priorityData.start_delay || '00:00:00';
      const delta = await supabase.rpc('calculate_delta', {
        p_start_delay: startDelay,
        p_gap_time: gapTimeData
      });
      
      // Calculate est_start = base_time + delta
      const estStart = await supabase.rpc('calculate_working_timestamp', {
        start_time: baseTimeData,
        work_hours: delta.data
      });
      
      // Calculate est_end = est_start + est_duration
      const estEnd = await supabase.rpc('calculate_working_timestamp', {
        start_time: estStart.data,
        work_hours: durationData
      });
      
      // Update the debug data
      setEtaDebugData({
        base_time: baseTimeData,
        gap_time: gapTimeData,
        delta: delta.data,
        est_start: estStart.data,
        est_end: estEnd.data
      });
      
    } catch (error) {
      console.error("Error calculating ETA:", error);
    } finally {
      setEtaCalculating(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    if (!projectId) return;
    console.log("Submitting form data:", formData);
    setIsSubmitting(true);
    try {
      const {
        data: userData,
        error: userError
      } = await supabase.auth.getUser();
      if (userError) {
        throw new Error(userError.message);
      }

      // Prepare task data for submission by excluding fields that don't exist in the tasks table
      const {
        image_urls,
        ...taskDataWithoutImages
      } = formData;
      const taskData = {
        ...taskDataWithoutImages,
        project_id: projectId,
        created_by: userData.user?.id
      };
      console.log("Sending task data to supabase:", taskData);
      const {
        data,
        error
      } = await supabase.from('tasks').insert(taskData).select().single();
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      console.log("Task created successfully:", data);
      toast({
        title: "Task created successfully",
        description: "Your task has been added to the project."
      });

      // Process interval fields for display and add to task data
      const processedData: TaskData = { ...data };
      
      if (processedData && processedData.actual_duration) {
        // Add the formatted property to the data object
        processedData.actual_duration_formatted = formatIntervalForDisplay(processedData.actual_duration);
      }

      // Set task created state and store the created task data
      setTaskCreated(true);
      setCreatedTaskData(processedData);

      // Refresh active task count
      fetchActiveTaskCount();
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setTaskCreated(false);
    setCreatedTaskData(null);
    setEtaDebugData(null);
  };

  // Function to render task status badges
  const renderTaskStatusBadges = (task: TaskData) => {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {task.is_onhold && (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            On Hold
          </Badge>
        )}
        {task.is_awaiting_input && (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Awaiting Input
          </Badge>
        )}
      </div>
    );
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "N/A";
    try {
      return format(new Date(timestamp), "MMM d, h:mm:ss a");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Format interval for display
  const formatInterval = (interval: string | null) => {
    if (!interval) return "N/A";
    try {
      // Try to extract hours, minutes, seconds
      const match = interval.match(/(\d+):(\d+):(\d+)/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseInt(match[3], 10);
        if (hours > 0) {
          return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
          return `${minutes}m ${seconds}s`;
        } else {
          return `${seconds}s`;
        }
      }
      return interval;
    } catch (e) {
      return interval;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-4 border-b sticky top-0 z-20 py-2 bg-background">
        <h2 className="font-semibold text-[14px]">
          {taskCreated 
            ? "Task Created Successfully" 
            : activeTaskCount > 0 
              ? `${activeTaskCount}  task${activeTaskCount > 1 ? 's' : ''} ahead` 
              : 'No active tasks'
          }
        </h2>
        <Button variant="ghost" size="icon" onClick={closeRightSidebar}>
          <X size={18} />
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {taskCreated ? (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-800 text-sm mb-2">Your task has been successfully created and added to the project.</p>
                  <div className="text-sm space-y-2 mt-4">
                    <h3 className="font-medium">Task Details:</h3>
                    <div className="flex gap-2 items-center">
                      {createdTaskData?.task_code && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {createdTaskData.task_code}
                        </Badge>
                      )}
                      <p><span className="font-medium">Description:</span> {createdTaskData?.details}</p>
                    </div>
                    <p><span className="font-medium">Status:</span> {createdTaskData?.current_status_id === 1 ? 'Open' : 'Pending'}</p>
                    <p><span className="font-medium">Priority:</span> {createdTaskData?.priority_level_id}</p>
                    
                    {/* Render status badges if task is on hold or awaiting input */}
                    {createdTaskData && renderTaskStatusBadges(createdTaskData)}
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <div className="border-t p-4 bg-background sticky bottom-0 z-10">
              <Button onClick={handleAddAnother} className="w-full">
                Add Another Task
              </Button>
            </div>
          </div>
        ) : (
          <>
            <TaskForm 
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting} 
              activeTaskCount={activeTaskCount}
              onFormChange={calculateETA}
            />
            
            {/* ETA Calculation Debug Panel */}
            <div className="border-t border-gray-200 mt-4 pt-2 mx-4 mb-4">
              <div 
                className="flex items-center justify-between cursor-pointer py-2"
                onClick={() => setShowDebugPanel(!showDebugPanel)}
              >
                <div className="flex items-center text-sm font-medium text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  Debug ETA Calculation
                </div>
                {showDebugPanel ? 
                  <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                }
              </div>
              
              {showDebugPanel && (
                <div className="py-2 px-3 bg-gray-50 rounded-md text-xs space-y-2 mb-4">
                  {etaCalculating ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                      <p>Calculating...</p>
                    </div>
                  ) : etaDebugData ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="font-medium">Queue Position:</div>
                        <div>{queuePosition ?? 'N/A'}</div>
                        
                        <div className="font-medium">Base Time:</div>
                        <div>{formatTimestamp(etaDebugData.base_time)}</div>
                        
                        <div className="font-medium">Gap Time:</div>
                        <div>{formatInterval(etaDebugData.gap_time)}</div>
                        
                        <div className="font-medium">Delta:</div>
                        <div>{formatInterval(etaDebugData.delta)}</div>
                        
                        <div className="font-medium">Est Start:</div>
                        <div className="text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                          {formatTimestamp(etaDebugData.est_start)}
                        </div>
                        
                        <div className="font-medium">Est End:</div>
                        <div className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          {formatTimestamp(etaDebugData.est_end)}
                        </div>
                      </div>
                      <p className="italic text-gray-500 pt-1">Debug values will not be saved with the task. This panel is for development only.</p>
                    </>
                  ) : (
                    <div className="py-4 text-center">
                      <p>Change form values to calculate ETA</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
