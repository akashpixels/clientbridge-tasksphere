import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import AttachmentHandler from "./AttachmentHandler";
import CommentSender from "./CommentSender";

interface TaskCommentThreadProps {
  taskId: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_profiles: {
    first_name: string;
  } | null;
}

const TaskCommentThread = ({ taskId }: TaskCommentThreadProps) => {
  const [newComment, setNewComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`id, content, created_at, user_profiles(first_name)`)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
  });

  useEffect(() => {
    const channel = supabase.channel('comments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, queryClient]);

  if (isLoading) {
    return <Loader2 className="w-6 h-6 animate-spin text-gray-500" />;
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4 space-y-4">
        {comments?.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <Avatar><AvatarFallback>{comment.user_profiles?.first_name?.[0]}</AvatarFallback></Avatar>
            <div>
              <span className="font-medium">{comment.user_profiles?.first_name}</span>
              <span className="text-xs text-gray-500">{format(new Date(comment.created_at), 'MMM d, h:mmaaa')}</span>
              <p className="text-sm">{comment.content}</p>
            </div>
          </div>
        ))}
      </ScrollArea>
     <div className="border-t p-4">
  <Textarea 
    value={newComment} 
    onChange={(e) => setNewComment(e.target.value)} 
    placeholder="Write a comment..." 
  />
  
  <div className="flex items-center mt-2 justify-end gap-2">
  {/* Attachment Button Next to Send */}
  <AttachmentHandler selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} />
  
  {/* Send Button */}
  <CommentSender 
    taskId={taskId} 
    newComment={newComment} 
    setNewComment={setNewComment} 
    selectedFiles={selectedFiles} 
    setSelectedFiles={setSelectedFiles} 
    onCommentPosted={() => queryClient.invalidateQueries(['taskComments', taskId])} 
  />
</div>

</div>

    </div>
  );
};

export default TaskCommentThread;
