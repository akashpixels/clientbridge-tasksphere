
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TaskCommentThreadProps {
  taskId: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  images: string[] | null;
  user_profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

const TaskCommentThread = ({ taskId }: TaskCommentThreadProps) => {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold">Comments</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {comments?.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  {comment.user_profiles?.first_name?.[0]}
                  {comment.user_profiles?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm">
                    {comment.user_profiles?.first_name} {comment.user_profiles?.last_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, h:mmaaa')}
                  </span>
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
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TaskCommentThread;
