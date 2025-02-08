
import React from 'react';
import { X, MessageCircle, Plus, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface CommentPanelProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  user_id: string;
  user_profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

export const CommentPanel = ({ taskId, isOpen, onClose }: CommentPanelProps) => {
  const [newComment, setNewComment] = React.useState('');
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      // Only fetch if we have a valid taskId
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          user_profiles:user_id(first_name, last_name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
    // Disable the query if there's no taskId
    enabled: Boolean(taskId),
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string; parent_id: string | null }) => {
      if (!taskId) throw new Error('No task ID provided');
      
      const { data, error } = await supabase
        .from('task_comments')
        .insert([
          {
            task_id: taskId,
            content: commentData.content,
            parent_id: commentData.parent_id,
          },
        ])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      setNewComment('');
      setReplyTo(null);
      toast({
        title: 'Comment added successfully',
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error adding comment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({
      content: newComment,
      parent_id: replyTo,
    });
  };

  // Group comments by parent_id
  const commentThreads = React.useMemo(() => {
    const threads: { [key: string]: Comment[] } = {};
    const rootComments: Comment[] = [];

    comments.forEach(comment => {
      if (comment.parent_id) {
        if (!threads[comment.parent_id]) {
          threads[comment.parent_id] = [];
        }
        threads[comment.parent_id].push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    return { rootComments, threads };
  }, [comments]);

  const renderComment = (comment: Comment, isReply = false) => {
    const replies = commentThreads.threads[comment.id] || [];

    return (
      <div key={comment.id} className={`${isReply ? 'ml-6' : 'mb-4'}`}>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-medium">
                {comment.user_profiles?.first_name} {comment.user_profiles?.last_name}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                {format(new Date(comment.created_at), 'MMM d, h:mm a')}
              </span>
            </div>
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(comment.id)}
                className="h-6 px-2"
              >
                Reply
              </Button>
            )}
          </div>
          <p className="text-gray-700 text-sm">{comment.content}</p>
        </div>
        {replies.map(reply => renderComment(reply, true))}
      </div>
    );
  };

  // Update last viewed timestamp
  React.useEffect(() => {
    if (isOpen && taskId) {
      supabase
        .from('task_comment_views')
        .upsert(
          { task_id: taskId, last_viewed_at: new Date().toISOString() },
          { onConflict: 'task_id,user_id' }
        )
        .then();
    }
  }, [isOpen, taskId]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-180px)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="text-center text-gray-500">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center text-gray-500">No comments yet</div>
            ) : (
              commentThreads.rootComments.map(comment => renderComment(comment))
            )}
          </div>

          <div className="border-t p-4">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                <span>Replying to comment</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(null)}
                  className="h-6 px-2"
                >
                  Cancel
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <Button onClick={handleSubmitComment} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
