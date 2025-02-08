
import { X } from "lucide-react";
import { Button } from "./button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "./textarea";
import { ScrollArea } from "./scroll-area";
import { useToast } from "./use-toast";
import { format } from "date-fns";

interface CommentsSidebarProps {
  taskId: string;
  onClose: () => void;
}

export function CommentsSidebar({ taskId, onClose }: CommentsSidebarProps) {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          user_profiles:user_id(
            first_name,
            last_name
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          content: newComment,
          task_id: taskId,
        });

      if (error) throw error;

      setNewComment("");
      
      toast({
        title: "Comment added successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error posting comment",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Comments</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                    {comment.user_profiles?.first_name?.[0]}
                    {comment.user_profiles?.last_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">
                        {comment.user_profiles?.first_name} {comment.user_profiles?.last_name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet</p>
        )}
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex flex-col gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
