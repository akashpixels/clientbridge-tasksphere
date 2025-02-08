
import React from 'react';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Send, X, Image } from 'lucide-react';

interface CommentsSidebarProps {
  taskId: string | null;
  onClose: () => void;
  currentUserId: string;
}

export const CommentsSidebar = ({ taskId, onClose, currentUserId }: CommentsSidebarProps) => {
  const [newComment, setNewComment] = React.useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data: comments, error } = await supabase
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
      return comments;
    },
    enabled: !!taskId,
  });

  const handleSubmitComment = async () => {
    if (!taskId || !newComment.trim()) return;

    const { error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: currentUserId,
        content: newComment.trim(),
      });

    if (!error) {
      setNewComment('');
    }
  };

  return (
    <Sheet open={!!taskId} onOpenChange={() => onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Comments</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="text-center">Loading comments...</div>
            ) : comments?.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {comment.user_profiles?.first_name?.[0]}
                    {comment.user_profiles?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">
                        {comment.user_profiles?.first_name} {comment.user_profiles?.last_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Button variant="outline" size="icon">
                <Image className="h-4 w-4" />
              </Button>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[80px]"
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button onClick={handleSubmitComment}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
