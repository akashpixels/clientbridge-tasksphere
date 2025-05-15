
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, X, Image, RefreshCw, PaperclipIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLayout } from "@/context/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import PreviewDialog from "./PreviewDialog";

interface TaskCommentThreadProps {
  taskId: string;
}

const TaskCommentThread = ({ taskId }: TaskCommentThreadProps) => {
  const { id: projectId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { closeRightSidebar } = useLayout();
  const [comment, setComment] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
  // Task query key for refetching task details
  const taskQueryKey = ["tasks", projectId, taskId];
  
  // Fetch task details
  const { data: task, isLoading: isLoadingTask } = useQuery({
    queryKey: taskQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          task_type:task_types(name, category),
          status:task_statuses!tasks_current_status_id_fkey(name, color_hex),
          priority:priority_levels(name, color_hex),
          complexity:complexity_levels(name, multiplier),
          assigned_user:user_profiles!tasks_assigned_user_id_fkey(first_name, last_name),
          task_attachments(*)
        `)
        .eq("id", taskId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  // Comments query key for refetching comments
  const commentsQueryKey = ["task-comments", taskId];

  // Fetch comments for the task
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: commentsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_comments")
        .select(`
          *,
          user:user_profiles(first_name, last_name, avatar_url),
          task_comment_attachments(*)
        `)
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
    refetchInterval: 10000, // Poll for new comments every 10 seconds
  });

  // Add comment mutation
  const { mutate: addComment, isPending: isAddingComment } = useMutation({
    mutationFn: async () => {
      let comment_id;
      
      // First, add the comment to the database
      const { data: commentData, error: commentError } = await supabase
        .from("task_comments")
        .insert([
          {
            task_id: taskId,
            content: comment,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          },
        ])
        .select()
        .single();

      if (commentError) throw commentError;
      
      comment_id = commentData.id;
      
      // If there are attachments, upload them
      if (attachments.length > 0) {
        const attachmentPromises = attachments.map(async (file) => {
          const filePath = `task-comments/${comment_id}/${file.name}`;
          
          // Upload the file to storage
          const { error: uploadError } = await supabase
            .storage
            .from("attachments")
            .upload(filePath, file);
            
          if (uploadError) throw uploadError;
          
          // Get the public URL
          const { data: urlData } = supabase
            .storage
            .from("attachments")
            .getPublicUrl(filePath);
            
          // Save attachment record in database
          const { error: attachmentError } = await supabase
            .from("task_comment_attachments")
            .insert([
              {
                task_comment_id: comment_id,
                filename: file.name,
                filesize: file.size,
                url: urlData.publicUrl,
              },
            ]);
            
          if (attachmentError) throw attachmentError;
        });
        
        await Promise.all(attachmentPromises);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      // Reset form
      setComment("");
      setAttachments([]);
      
      // Refetch comments and task data
      queryClient.invalidateQueries({ queryKey: commentsQueryKey });
      queryClient.invalidateQueries({ queryKey: taskQueryKey });
      
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast({
        title: "Error adding comment",
        description: "There was an error adding your comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom when new comments are added
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setAttachments((prevAttachments) => [...prevAttachments, ...filesArray]);
    }
  };

  // Handle removing an attachment
  const handleRemoveAttachment = (index: number) => {
    setAttachments((prevAttachments) => {
      const newAttachments = [...prevAttachments];
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  // Handle submitting the comment
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() === "" && attachments.length === 0) return;
    
    addComment();
  };

  // Open file dialog
  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center px-4 border-b sticky top-0 z-20 py-2 bg-background">
        <div>
          <h2 className="font-semibold text-[14px]">
            {task ? task.title : "Task Comments"}
          </h2>
          {task && task.status && (
            <span 
              className="inline-block px-1.5 py-0.5 rounded-full text-[10px] mt-0.5"
              style={{
                backgroundColor: `${task.status.color_hex}15`,
                color: task.status.color_hex
              }}
            >
              {task.status.name}
            </span>
          )}
        </div>
        <button 
          onClick={closeRightSidebar}
          className="rounded-full p-1.5 hover:bg-gray-100"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Comments Section */}
      <ScrollArea className="flex-1 p-4">
        {isLoadingTask || isLoadingComments ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="animate-spin h-8 w-8 text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading comments...</p>
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user?.avatar_url || undefined} />
                  <AvatarFallback>
                    {getInitials(`${comment.user?.first_name} ${comment.user?.last_name}`)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {comment.user?.first_name} {comment.user?.last_name}
                    </p>
                    <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatDistanceToNow(parseISO(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="text-sm whitespace-pre-wrap">{comment.content}</div>
                  
                  {/* Comment Attachments */}
                  {comment.task_comment_attachments && comment.task_comment_attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {comment.task_comment_attachments.map((attachment) => {
                        const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(attachment.url);
                        
                        return isImage ? (
                          <div 
                            key={attachment.id} 
                            className="cursor-pointer relative group"
                            onClick={() => setPreviewUrl(attachment.url)}
                          >
                            <img 
                              src={attachment.url} 
                              alt={attachment.filename} 
                              className="h-20 w-20 object-cover rounded"
                            />
                          </div>
                        ) : (
                          <a 
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs px-2 py-1.5 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            <PaperclipIcon className="h-3 w-3" />
                            {attachment.filename}
                          </a>
                        );
                      })}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <RefreshCw className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No comments yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Be the first to add a comment to this task
            </p>
          </div>
        )}
      </ScrollArea>
      
      {/* Comment Form */}
      <div className="border-t p-4 bg-card">
        <form onSubmit={handleSubmitComment}>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="resize-none"
          />
          
          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map((file, index) => (
                <Badge 
                  key={index} 
                  className="gap-1 pl-2 pr-1 py-1"
                >
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button 
                    type="button" 
                    className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                    onClick={() => handleRemoveAttachment(index)}
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center mt-2">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700"
              onClick={handleAttachmentClick}
            >
              <Image size={18} />
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
            </button>
            
            <button
              type="submit"
              className="bg-primary text-white p-1.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                isAddingComment || 
                uploadingAttachments || 
                (comment.trim() === "" && attachments.length === 0)
              }
            >
              {isAddingComment || uploadingAttachments ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Preview Dialog */}
      <PreviewDialog
        isOpen={!!previewUrl}
        imageUrl={previewUrl}
        onClose={() => setPreviewUrl(null)}
      />
    </div>
  );
};

export default TaskCommentThread;
