
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PaperclipIcon, Send, X } from "lucide-react";
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { getInitials } from '@/lib/utils';
import CommentList from './CommentList';
import PreviewDialog from './PreviewDialog';
import CommentInputRequest from './CommentInputRequest';
import AttachmentHandler from './AttachmentHandler';
import FilePreview from './FilePreview';
import { useLayout } from '@/context/layout';

interface TaskCommentThreadProps {
  taskId: string;
  taskCode?: string;
}

// Updated Comment interface to be compatible with CommentList & CommentItem
interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  user: {
    first_name: string;
    last_name: string;
  } | null;
  user_profiles?: {
    first_name: string;
  } | null;
  is_input_request: boolean;
  is_input_response: boolean;
  parent_id?: string | null;
  images: string[] | null; // Must be string[] | null to match CommentItem expectation
  file_url?: string | null;
}

interface Task {
  id: string;
  details: string;
  task_code?: string;
}

const TaskCommentThread: React.FC<TaskCommentThreadProps> = ({ taskId, taskCode }) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const { closeRightSidebar } = useLayout();
  const [message, setMessage] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isLargeTextarea, setIsLargeTextarea] = useState(false);
  const [isRequestingInput, setIsRequestingInput] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{url: string, type: string, name: string} | null>(null);
  const [pendingInputRequest, setPendingInputRequest] = useState<Comment | null>(null);
  
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

  // Determine if there's a pending input request that hasn't been responded to
  useEffect(() => {
    if (comments && comments.length) {
      // Find the most recent input request without a response
      const inputRequest = comments.find(comment => 
        comment.is_input_request && 
        !comments.some(c => c.is_input_response && c.parent_id === comment.id)
      );
      
      setPendingInputRequest(inputRequest || null);
    }
  }, [comments]);

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

  // Updated fetchComments to ensure proper type conversion
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
      const typedComments = (data || []).map(comment => {
        // Create a properly typed user object, handling potential null or error cases
        let userObject = null;
        
        if (comment.user && typeof comment.user === 'object' && !('error' in comment.user)) {
          userObject = {
            first_name: comment.user.first_name || 'Unknown',
            last_name: comment.user.last_name || 'User',
          };
        }
        
        // Ensure images are properly converted to string[]
        const images = Array.isArray(comment.images) 
          ? comment.images.map(img => typeof img === 'string' ? img : String(img))
          : null;
        
        return {
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          user_id: comment.user_id,
          user: userObject,
          is_input_request: comment.is_input_request || false,
          is_input_response: comment.is_input_response || false,
          parent_id: comment.parent_id,
          images: images,
          file_url: comment.file_url
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

  const handleFileClick = (url: string) => {
    const fileType = url.split('.').pop()?.toLowerCase() || 'file';
    const fileName = url.split('/').pop() || 'file';
    
    handleAttachmentClick({
      url,
      type: fileType,
      name: fileName
    });
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    if (!files.length) return [];
    
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `task_comments/${taskId}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: uploadError.message,
        });
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFiles.length) {
      toast({
        description: "Please enter a message or attach a file",
      });
      return;
    }
    
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to post comments",
      });
      return;
    }

    setSendingMessage(true);

    try {
      // Upload all selected files
      const uploadedUrls = await uploadFiles(selectedFiles);

      // Determine if this is an input response
      const isInputResponse = !!pendingInputRequest;
      const parentId = isInputResponse ? pendingInputRequest.id : null;

      const { error } = await supabase.from('task_comments').insert({
        task_id: taskId,
        user_id: session.user.id, // This is crucial for the database function
        content: message.trim() || (selectedFiles.length ? `Attached ${selectedFiles.length} file(s)` : ''),
        is_input_request: isRequestingInput,
        is_input_response: isInputResponse,
        parent_id: parentId,
        images: uploadedUrls
      });

      if (error) {
        throw error;
      }

      setMessage('');
      setSelectedFiles([]);
      setIsRequestingInput(false);
      
      toast({
        title: isInputResponse ? "Input provided" : (isRequestingInput ? "Input requested" : "Comment sent"),
      });
      
      // Fetch the latest comments to update the UI
      fetchComments();
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
      <div className="flex justify-between items-center px-4 border-b sticky top-0 z-20 py-2 bg-background">
        <h3 className="text-sm text-gray-500">{task?.task_code || taskCode} Comments</h3>
        <Button variant="ghost" size="icon" onClick={closeRightSidebar}>
          <X size={18} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <CommentList 
          comments={comments} 
          onFileClick={handleFileClick} 
        />
      </div>

      <div className="p-4 border-t">
        <div className="flex flex-col space-y-2">
          <CommentInputRequest 
            isInputResponse={!!pendingInputRequest}
            isRequestingInput={isRequestingInput}
            setIsRequestingInput={setIsRequestingInput}
          />
          
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              pendingInputRequest 
                ? "Type your response to the input request..." 
                : "Type your comment here..."
            }
            rows={isLargeTextarea ? 4 : 1}
            onFocus={() => setIsLargeTextarea(true)}
            onBlur={() => message.length === 0 && setIsLargeTextarea(false)}
            className="resize-none"
          />
          <div className="flex justify-between items-center">
            <AttachmentHandler
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
            />
            <Button 
              onClick={handleSendMessage} 
              size="sm" 
              className="flex items-center gap-1"
              disabled={sendingMessage || (message.trim() === '' && selectedFiles.length === 0)}
            >
              {sendingMessage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} 
              {pendingInputRequest 
                ? "Submit Input"
                : isRequestingInput 
                  ? "Request Input" 
                  : "Send"}
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
