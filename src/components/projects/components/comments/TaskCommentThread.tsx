
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, PaperclipIcon, Send } from "lucide-react";
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { getInitials } from '@/lib/utils';
import PreviewDialog from './PreviewDialog';

interface TaskCommentThreadProps {
  taskId: string;
  taskCode?: string;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user: UserProfile | null; // Making user optional and properly typed
  is_input_request: boolean;
  is_input_response: boolean;
  images: string[];
  file_url?: string | null;
}

interface Task {
  id: string;
  details: string;
  task_code?: string;
}

const TaskCommentThread: React.FC<TaskCommentThreadProps> = ({ taskId, taskCode }) => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isLargeTextarea, setIsLargeTextarea] = useState(false);
  const [isInputRequest, setIsInputRequest] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{url: string, type: string, name: string} | null>(null);
  
  useEffect(() => {
    fetchComments();
    fetchTask();

    // Set up real-time subscription for new comments
    const channel = supabase
      .channel('task-comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`
        },
        (payload) => {
          console.log('Comment change detected:', payload);
          if (payload.eventType === 'INSERT') {
            fetchComments(); // Refetch all comments when a new one is added
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const fetchTask = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        details,
        task_code
      `)
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return;
    }

    setTask(data);
  };

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        user:user_profiles(
          first_name,
          last_name
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      toast({
        variant: "destructive",
        title: "Error fetching comments",
        description: error.message,
      });
    } else {
      // Transform the data to ensure it matches our Comment type
      const typedComments: Comment[] = (data || []).map(comment => {
        // Create a properly typed user object, handling potential null or error cases
        let userProfile: UserProfile | null = null;
        
        if (comment.user && typeof comment.user === 'object' && !('error' in comment.user)) {
          userProfile = {
            first_name: comment.user.first_name || 'Unknown',
            last_name: comment.user.last_name || 'User',
            avatar_url: null // We removed avatar_url from the query since it doesn't exist
          };
        }
        
        return {
          ...comment,
          user: userProfile,
          images: Array.isArray(comment.images) ? comment.images : []
        } as Comment;
      });
      
      setComments(typedComments);
    }
    setLoading(false);
  };

  const handleAttachmentClick = (file: {url: string, type: string, name: string}) => {
    setPreviewFile(file);
    setPreviewDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `comments/${taskId}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: uploadError.message,
      });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) {
      toast({
        description: "Please enter a message or attach a file",
      });
      return;
    }

    setSendingMessage(true);

    try {
      let fileUrl = null;
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
      }

      const { error } = await supabase.from('task_comments').insert({
        task_id: taskId,
        content: message.trim() || (selectedFile ? `Attached file: ${selectedFile.name}` : ''),
        is_input_request: isInputRequest,
        file_url: fileUrl
      });

      if (error) {
        throw error;
      }

      setMessage('');
      setSelectedFile(null);
      setIsInputRequest(false);
      
      toast({
        title: "Comment sent",
      });
    } catch (error) {
      console.error('Error sending comment:', error);
      toast({
        variant: "destructive",
        title: "Failed to send comment",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, h:mm a');
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h3 className="font-medium">{task?.task_code || taskCode} Comments</h3>
        <p className="text-sm text-gray-500 mt-1 truncate">{task?.details}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="h-8 w-8">
                {comment.user?.avatar_url ? (
                  <AvatarImage src={comment.user.avatar_url} alt={`${comment.user.first_name} ${comment.user.last_name}`} />
                ) : (
                  <AvatarFallback>
                    {getInitials(comment.user?.first_name || 'U', comment.user?.last_name || 'U')}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm">
                    {comment.user ? `${comment.user.first_name} ${comment.user.last_name}` : 'Unknown User'}
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(comment.created_at)}</div>
                </div>
                <div className="text-sm mt-1">
                  {comment.content}
                </div>
                {comment.is_input_request && (
                  <div className="mt-1 text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-sm inline-block">
                    Input requested
                  </div>
                )}
                {comment.is_input_response && (
                  <div className="mt-1 text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded-sm inline-block">
                    Input provided
                  </div>
                )}
                {comment.images && comment.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {comment.images.map((image, index) => (
                      <img 
                        key={index} 
                        src={image} 
                        alt={`Attachment ${index + 1}`} 
                        className="h-24 w-auto rounded border object-cover cursor-pointer" 
                        onClick={() => handleAttachmentClick({
                          url: image,
                          type: 'image',
                          name: `Image ${index + 1}`
                        })}
                      />
                    ))}
                  </div>
                )}
                {comment.file_url && (
                  <div className="mt-2">
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto text-xs text-blue-500 flex items-center"
                      onClick={() => handleAttachmentClick({
                        url: comment.file_url!,
                        type: comment.file_url!.split('.').pop() || 'file',
                        name: comment.file_url!.split('/').pop() || 'file'
                      })}
                    >
                      <PaperclipIcon className="h-3 w-3 mr-1" />
                      View Attachment
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex flex-col space-y-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your comment here..."
            rows={isLargeTextarea ? 4 : 1}
            onFocus={() => setIsLargeTextarea(true)}
            onBlur={() => message.length === 0 && setIsLargeTextarea(false)}
            className="resize-none"
          />
          <div className="flex justify-between items-center">
            <div className="flex space-x-2 items-center">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setIsInputRequest(!isInputRequest)}
              >
                {isInputRequest ? "Cancel Input Request" : "Request Input"}
              </Button>
              <div className="relative">
                <Button type="button" size="icon" variant="outline" className="h-8 w-8">
                  <PaperclipIcon className="h-4 w-4" />
                  <input 
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                </Button>
                {selectedFile && (
                  <span className="text-xs ml-2">{selectedFile.name}</span>
                )}
              </div>
            </div>
            <Button 
              onClick={handleSendMessage} 
              size="sm" 
              className="flex items-center gap-1"
              disabled={sendingMessage || (message.trim() === '' && !selectedFile)}
            >
              {sendingMessage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} 
              Send
            </Button>
          </div>
        </div>
      </div>
      
      <PreviewDialog
        isOpen={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        file={previewFile}
      />
    </div>
  );
};

export default TaskCommentThread;
