
import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import TasksTable from "./TasksTable";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";

interface TasksTabContentProps {
  isLoadingTasks: boolean;
  tasks: (Tables<"tasks"> & {
    task_type: {
      name: string;
      category: string;
    } | null;
    status: {
      name: string;
      color_hex: string | null;
    } | null;
    priority: {
      name: string;
      color: string;
    } | null;
    complexity: {
      name: string;
      multiplier: number;
    } | null;
    assigned_user: {
      first_name: string;
      last_name: string;
    } | null;
    task_code?: string;
    awaiting_input?: boolean;
    start_time?: string | null;
    eta?: string | null;
  })[];
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc';
  };
  onSort: (key: string) => void;
  onImageClick: (image: string, images: string[]) => void;
  onCommentClick: (taskId: string) => void;
}

const TasksTabContent = ({
  isLoadingTasks,
  tasks,
  sortConfig,
  onSort,
  onImageClick,
  onCommentClick,
}: TasksTabContentProps) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const [enhancedTasks, setEnhancedTasks] = useState(tasks);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  // Fetch additional timeline data for tasks
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setEnhancedTasks([]);
      return;
    }
    
    const fetchTimelineData = async () => {
      setIsEnhancing(true);
      
      try {
        // Get task ids
        const taskIds = tasks.map(task => task.id);
        
        // Get timeline data for these tasks
        const { data: timelineData, error } = await supabase
          .from('task_timeline')
          .select('task_id, start_time, eta')
          .in('task_id', taskIds);
          
        if (error) {
          console.error('Error fetching task timeline data:', error);
          setEnhancedTasks(tasks);
          return;
        }
        
        if (!timelineData || timelineData.length === 0) {
          console.log('No timeline data found for tasks');
          setEnhancedTasks(tasks);
          return;
        }
        
        // Create a map of task_id -> timeline data
        const timelineMap = new Map();
        timelineData.forEach(item => {
          timelineMap.set(item.task_id, {
            start_time: item.start_time,
            eta: item.eta
          });
        });
        
        // Enhance the tasks with the timeline data
        const newTasks = tasks.map(task => {
          const timelineInfo = timelineMap.get(task.id);
          
          if (timelineInfo) {
            return {
              ...task,
              start_time: timelineInfo.start_time,
              eta: timelineInfo.eta
            };
          }
          
          return task;
        });
        
        setEnhancedTasks(newTasks);
      } catch (e) {
        console.error('Error enhancing tasks with timeline data:', e);
        setEnhancedTasks(tasks);
      } finally {
        setIsEnhancing(false);
      }
    };
    
    fetchTimelineData();
  }, [tasks]);
  
  // Add diagnostic output
  useEffect(() => {
    console.log("TasksTabContent rendered with tasks:", tasks?.length || 0);
    console.log("isLoadingTasks:", isLoadingTasks);
    
    // Check if we can directly access the tasks table
    const checkTasksAccess = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, details, task_code, current_status_id')
          .limit(5);
          
        console.log("Direct tasks access test:", data?.length || 0);
        if (error) {
          console.error("Direct tasks access error:", error);
        }
      } catch (e) {
        console.error("Error in direct tasks check:", e);
      }
    };
    
    checkTasksAccess();
  }, [tasks, isLoadingTasks]);
  
  // Setup real-time subscription for comment changes
  useEffect(() => {
    const channel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments'
        },
        (payload) => {
          console.log('Comment change received:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle task selection
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    onCommentClick(taskId);
  };

  const isLoading = isLoadingTasks || isEnhancing;

  return (
    <Card className="p-0">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading tasks...</p>
        </div>
      ) : enhancedTasks && enhancedTasks.length > 0 ? (
        <div className="overflow-x-auto">
          <TasksTable 
            tasks={enhancedTasks}
            sortConfig={sortConfig}
            onSort={onSort}
            onImageClick={onImageClick}
            onCommentClick={handleTaskClick}
            selectedTaskId={selectedTaskId}
          />
        </div>
      ) : (
        <div className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <p className="text-lg font-semibold">No tasks found for this project.</p>
          <p className="text-sm text-gray-500 mt-2">
            This could be due to permission settings or because no tasks exist for this project.
          </p>
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-left">
            <p className="font-medium">Debugging information:</p>
            <p className="mt-1 text-xs">Project ID: {window.location.pathname.split('/').pop()}</p>
            <p className="mt-1 text-xs">Status: Task timeline view active</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TasksTabContent;
