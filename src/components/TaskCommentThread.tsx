
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface TaskCommentThreadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
}

const TaskCommentThread = ({ open, onOpenChange, taskId }: TaskCommentThreadProps) => {
  const { data: task, isLoading } = useQuery({
    queryKey: ['task-detail', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_status(name, color_hex),
          task_comments(
            id,
            content,
            created_at,
            user_profiles(id, first_name, last_name, avatar_url)
          ),
          task_attachments(id, file_name, file_url, file_type, created_at)
        `)
        .eq('id', taskId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!taskId && open
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task?.title || 'Task Details'}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : task ? (
          <div className="space-y-6">
            {/* Task Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <div className="mt-1">
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                  style={{ 
                    backgroundColor: task.task_status?.color_hex ? `${task.task_status.color_hex}20` : '#e5e7eb',
                    color: task.task_status?.color_hex || '#374151' 
                  }}
                >
                  {task.task_status?.name || 'Unknown'}
                </span>
              </div>
            </div>
            
            {/* Task Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <div className="mt-1 text-sm text-gray-900">
                {task.details || 'No description provided.'}
              </div>
            </div>
            
            {/* Task Comments */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Comments</h3>
              {task.task_comments && task.task_comments.length > 0 ? (
                <div className="mt-3 space-y-4">
                  {task.task_comments
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map(comment => (
                      <div key={comment.id} className="flex space-x-3">
                        {comment.user_profiles?.avatar_url ? (
                          <img 
                            src={comment.user_profiles.avatar_url} 
                            alt="User avatar"
                            className="h-8 w-8 rounded-full" 
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            {comment.user_profiles?.first_name?.[0] || '?'}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="text-sm font-medium text-gray-900">
                              {comment.user_profiles ? 
                                `${comment.user_profiles.first_name} ${comment.user_profiles.last_name}` : 
                                'Unknown User'}
                            </h4>
                            <span className="ml-2 text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-700">
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="mt-1 text-sm text-gray-500">No comments yet.</div>
              )}
            </div>
            
            {/* Task Attachments */}
            {task.task_attachments && task.task_attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Attachments</h3>
                <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {task.task_attachments.map(attachment => (
                    <a
                      key={attachment.id}
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                    >
                      {attachment.file_type?.startsWith('image/') ? (
                        <img
                          src={attachment.file_url}
                          alt={attachment.file_name}
                          className="h-32 w-full object-cover transition-opacity group-hover:opacity-90"
                        />
                      ) : (
                        <div className="flex h-32 w-full items-center justify-center p-4 text-gray-500">
                          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="p-2 text-xs truncate bg-white">{attachment.file_name}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Task not found or has been deleted.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskCommentThread;
