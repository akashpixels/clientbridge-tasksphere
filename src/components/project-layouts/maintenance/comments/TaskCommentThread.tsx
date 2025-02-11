
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileText, File } from "lucide-react";

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
  images: string[] | null;
}

const TaskCommentThread = ({ taskId }: TaskCommentThreadProps) => {
  const [newComment, setNewComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`id, content, created_at, user_profiles(first_name), images`)
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

  const handleFileClick = (url: string) => {
    const fileExtension = url.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
    
    if (isImage) {
      setSelectedImage(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const getFileIcon = (url: string) => {
    const fileExtension = url.split('.').pop()?.toLowerCase();
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension || '')) {
      return <FileText className="h-10 w-10 text-blue-500" />;
    }
    return <File className="h-10 w-10 text-gray-500" />;
  };

  if (isLoading) {
    return <Loader2 className="w-6 h-6 animate-spin text-gray-500" />;
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4 space-y-4">
        {comments?.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <Avatar><AvatarFallback>{comment.user_profiles?.first_name?.[0]}</AvatarFallback></Avatar>
            <div className="flex-1">
              <span className="font-medium">{comment.user_profiles?.first_name}</span>
              <span className="text-xs text-gray-500 ml-2">{format(new Date(comment.created_at), 'MMM d, h:mmaaa')}</span>
              <p className="text-sm mt-1">{comment.content}</p>
              
              {comment.images && comment.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {comment.images.map((url, index) => {
                    const fileExtension = url.split('.').pop()?.toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                    
                    return (
                      <div
                        key={index}
                        onClick={() => handleFileClick(url)}
                        className="cursor-pointer border rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        {isImage ? (
                          <div className="aspect-square">
                            <img
                              src={url}
                              alt="Attachment"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square flex items-center justify-center bg-gray-50">
                            {getFileIcon(url)}
                            <span className="text-xs text-gray-500 mt-1 text-center">
                              {url.split('/').pop()?.slice(0, 15)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
          <AttachmentHandler selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} />
          <CommentSender 
            taskId={taskId} 
            newComment={newComment} 
            setNewComment={setNewComment} 
            selectedFiles={selectedFiles} 
            setSelectedFiles={setSelectedFiles} 
            onCommentPosted={() => queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] })} 
          />
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <div className="w-full h-[80vh] flex items-center justify-center bg-gray-50">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskCommentThread;
