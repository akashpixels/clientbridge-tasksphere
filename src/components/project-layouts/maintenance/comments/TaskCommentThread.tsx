
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CommentList from "./CommentList";
import CommentSender from "./CommentSender";
import CommentInputRequest from "./CommentInputRequest";
import { Button } from "@/components/ui/button";
import { X, MessageCircle, PenLine, Image, RefreshCw, Clock } from "lucide-react";
import { useLayout } from "@/context/layout";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import TaskDebugInfo from "../TaskDebugInfo";

interface TaskCommentThreadProps {
  taskId: string;
  taskCode?: string;
}

const TaskCommentThread = ({ taskId, taskCode }: TaskCommentThreadProps) => {
  const [isRequestingInput, setIsRequestingInput] = useState(false);
  const { closeRightSidebar } = useLayout();
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  // Fetch task details including extra_details
  const { data: task, isLoading: isLoadingTask } = useQuery({
    queryKey: ['task-details', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_type:task_types(name, category),
          status:task_statuses(name, color_hex),
          priority:priority_levels(name, color_hex),
          complexity:complexity_levels(name, multiplier),
          assigned_user:user_profiles!tasks_assigned_user_id_fkey(first_name, last_name)
        `)
        .eq('id', taskId)
        .single();

      if (error) {
        console.error('Error fetching task details:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!taskId,
  });

  // Mark comments as viewed
  useEffect(() => {
    if (!taskId) return;
    
    const markCommentsAsViewed = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        
        const { error } = await supabase
          .from('task_comment_views')
          .upsert({
            task_id: taskId,
            user_id: userData.user.id,
            viewed_at: new Date().toISOString()
          }, {
            onConflict: 'task_id,user_id'
          });
          
        if (error) {
          console.error('Error marking comments as viewed:', error);
        }
      } catch (err) {
        console.error('Error in markCommentsAsViewed:', err);
      }
    };
    
    markCommentsAsViewed();
  }, [taskId]);

  const getStatusColor = (status: {
    name: string;
    color_hex: string | null;
  } | null) => {
    if (!status?.color_hex) {
      return {
        bg: '#F3F4F6',
        text: '#374151'
      };
    }
    const hex = status.color_hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const max = Math.max(r, g, b);
    const saturationMultiplier = 1.3;
    const darkenFactor = 0.8;
    const newR = r === max ? Math.min(255, r * saturationMultiplier * darkenFactor) : r * darkenFactor;
    const newG = g === max ? Math.min(255, g * saturationMultiplier * darkenFactor) : g * darkenFactor;
    const newB = b === max ? Math.min(255, b * saturationMultiplier * darkenFactor) : b * darkenFactor;
    const enhancedColor = `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
    return {
      bg: status.color_hex,
      text: enhancedColor
    };
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-4 border-b sticky top-0 z-20 py-2 bg-background">
        <h2 className="font-semibold text-[14px]">
          {taskCode || 'Task Comments'}
        </h2>
        <Button variant="ghost" size="icon" onClick={closeRightSidebar}>
          <X size={18} />
        </Button>
      </div>
      
      {isLoadingTask ? (
        <div className="p-4 flex items-center justify-center">
          <RefreshCw className="animate-spin mr-2" size={16} />
          <span>Loading task details...</span>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {task && (
            <div className="p-4 border-b">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2 mb-2">
                  <Badge 
                    className="font-mono text-xs"
                    variant="outline"
                  >
                    {taskCode || '—'}
                  </Badge>
                  
                  <span 
                    className="px-2 py-1 text-xs rounded-full font-semibold" 
                    style={{
                      backgroundColor: getStatusColor(task.status).bg,
                      color: getStatusColor(task.status).text
                    }}
                  >
                    {task.status?.name || 'Unknown Status'}
                  </span>
                </div>
                
                <p className="text-sm">{task.details}</p>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <div>Created: {format(new Date(task.created_at), "MMM d, yyyy")}</div>
                  {task.est_start && <div>ETA: {format(new Date(task.est_start), "MMM d, h:mm a")}</div>}
                </div>
              </div>
              
              {/* Add TaskDebugInfo component */}
              <TaskDebugInfo 
                taskId={taskId} 
                extraDetails={task.extra_details} 
              />
            </div>
          )}
          
          <div className="flex-1 overflow-auto p-4">
            <CommentList
              taskId={taskId}
            />
            
            <div ref={scrollBottomRef} />
          </div>
          
          <div className="border-t p-3 bg-background">
            {isRequestingInput ? (
              <CommentInputRequest
                taskId={taskId}
                onCancel={() => setIsRequestingInput(false)}
                onSuccess={() => setIsRequestingInput(false)}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsRequestingInput(true)}
                  >
                    <PenLine className="mr-2 h-4 w-4" />
                    Request Input
                  </Button>
                </div>
                <CommentSender taskId={taskId} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCommentThread;
