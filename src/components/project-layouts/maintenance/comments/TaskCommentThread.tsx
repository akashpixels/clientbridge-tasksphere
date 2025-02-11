
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2, Reply, Paperclip, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface TaskCommentThreadProps {
  taskId: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  images: string[] | null;
  user_profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

const TaskCommentThread = ({ taskId }: TaskCommentThreadProps) => {
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          user_profiles:user_profiles!task_comments_user_id_fkey(
            first_name,
            last_name
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() && selectedFiles.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const uploadedImages: string[] = [];

      // Upload files if any
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${taskId}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('comment_attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('comment_attachments')
          .getPublicUrl(filePath);

        uploadedImages.push(publicUrl);
      }

      // Insert comment
      const { error: commentError } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          content: newComment,
          parent_id: replyToId,
          images: uploadedImages,
        });

      if (commentError) throw commentError;

      setNewComment("");
      setSelectedFiles([]);
      setReplyToId(null);
      
      toast({
        title: "Comment posted successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error posting comment",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const organizeComments = (comments: Comment[]) => {
    const commentMap = new Map();
    const topLevelComments: Comment[] = [];

    comments?.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments?.forEach(comment => {
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        commentMap.get(comment.parent_id).replies.push(commentMap.get(comment.id));
      } else {
        topLevelComments.push(commentMap.get(comment.id));
      }
    });

    return topLevelComments;
  };

  const CommentComponent = ({ comment, level = 0 }: { comment: Comment & { replies: any[] }, level: number }) => (
    <div className={`flex gap-3 ${level > 0 ? 'ml-8' : ''}`}>
      <Avatar className="w-8 h-8">
        <AvatarFallback>
          {comment.user_profiles?.first_name?.[0]}
          {comment.user_profiles?.last_name?.[0]}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-baseline gap-2 justify-between">
          <div>
            <span className="font-medium text-sm">
              {comment.user_profiles?.first_name} {comment.user_profiles?.last_name}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {format(new Date(comment.created_at), 'MMM d, h:mmaaa')}
            </span>
          </div>
          {level === 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-gray-500 hover:text-gray-700"
              onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
            >
              <Reply className="h-4 w-4 mr-1" />
              Reply
            </Button>
          )}
        </div>
        
        <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
        
        {comment.images && comment.images.length > 0 && (
          <div className="mt-2 flex gap-2">
            {comment.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Comment attachment ${index + 1}`}
                className="w-20 h-20 object-cover rounded-md"
              />
            ))}
          </div>
        )}

        {comment.replies?.map((reply: Comment & { replies: any[] }) => (
          <CommentComponent key={reply.id} comment={reply} level={level + 1} />
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  const organizedComments = organizeComments(comments || []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold">Comments</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {organizedComments.map((comment) => (
            <CommentComponent key={comment.id} comment={comment} level={0} />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        {replyToId && (
          <div className="flex justify-between items-center mb-2 text-sm text-gray-500 bg-muted p-2 rounded">
            <span>Replying to comment</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyToId(null)}
            >
              Cancel
            </Button>
          </div>
        )}
        
        <div className="space-y-2">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="comment-attachments"
                accept="image/*"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('comment-attachments')?.click()}
              >
                <Paperclip className="h-4 w-4 mr-1" />
                Attach files
              </Button>
              {selectedFiles.length > 0 && (
                <span className="text-sm text-gray-500 my-auto">
                  {selectedFiles.length} file(s) selected
                </span>
              )}
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (!newComment.trim() && selectedFiles.length === 0)}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCommentThread;
