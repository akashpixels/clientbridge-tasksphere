
import { format } from "date-fns";
import { MessageSquare, Reply } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tables } from "@/integrations/supabase/types";

interface CommentThreadProps {
  comment: Tables<"task_comments"> & {
    user_profiles: {
      first_name: string;
      last_name: string;
    } | null;
  };
  comments: Tables<"task_comments">[];
}

const CommentThread = ({ comment, comments }: CommentThreadProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const { toast } = useToast();

  const replies = comments.filter(c => c.parent_id === comment.id);

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          content: replyContent,
          task_id: comment.task_id,
          parent_id: comment.id,
        });

      if (error) throw error;

      setReplyContent("");
      setIsReplying(false);
      
      toast({
        title: "Reply added successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: "Error posting reply",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="p-3 rounded-lg bg-muted/50">
        <div className="flex items-start gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {comment.user_profiles?.first_name?.[0]}
            {comment.user_profiles?.last_name?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <p className="font-medium">
                {comment.user_profiles?.first_name} {comment.user_profiles?.last_name}
              </p>
              <span className="text-xs text-muted-foreground">
                {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <p className="mt-1">{comment.content}</p>
            {comment.file_url && (
              <a 
                href={comment.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                View attachment
              </a>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setIsReplying(!isReplying)}
        >
          <Reply className="h-3 w-3 mr-1" />
          Reply
        </Button>
      </div>

      {isReplying && (
        <div className="ml-8 mb-4">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[60px] mb-2"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReplying(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleReply}>
              Reply
            </Button>
          </div>
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-8 space-y-2">
          {replies.map(reply => (
            <CommentThread
              key={reply.id}
              comment={reply as any}
              comments={comments}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentThread;
