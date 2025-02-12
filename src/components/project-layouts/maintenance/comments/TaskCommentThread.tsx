
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2, FileText, File } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import AttachmentHandler from "./AttachmentHandler";
import CommentSender from "./CommentSender";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
    const isDocument = ['doc', 'docx', 'xls', 'xlsx', 'pdf'].includes(fileExtension || '');

    if (isImage) {
      setSelectedImage(url);
    } else if (isDocument) {
      setSelectedImage(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const getFileIcon = (url: string) => {
    const fileExtension = url.split('.').pop()?.toLowerCase();
    switch (fileExtension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-6 w-6 text-green-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const getFileName = (url: string) => {
    const fileName = decodeURIComponent(url.split('/').pop() || '');
    const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.')) || fileName;
    return nameWithoutExt.length <= 20 ? nameWithoutExt : `${nameWithoutExt.slice(0, 20)}...`;
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
                <div className="mt-2">
                  {/* IMAGE PREVIEW: Display in a row with overlap */}
                  <div className="flex items-center">
                    {comment.images
                      .filter((url) => {
                        const fileExtension = url.split('.').pop()?.toLowerCase();
                        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
                      })
                      .map((url, index) => (
                        <div
                          key={index}
                          onClick={() => handleFileClick(url)}
                          className="relative w-12 h-12 cursor-pointer transition-transform hover:scale-105"
                          style={{ marginLeft: index === 0 ? "0" : "-8px" }}
                        >
                          <img
                            src={url}
                            alt="Attachment"
                            className="w-full h-full object-cover rounded-lg border"
                          />
                        </div>
                      ))}
                  </div>

                  {/* FILES PREVIEW: Display inline */}
                  <div className="mt-2 flex flex-col space-y-2">
                    {comment.images
                      .filter((url) => {
                        const fileExtension = url.split('.').pop()?.toLowerCase();
                        return !['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
                      })
                      .map((url, index) => (
                        <div
                          key={index}
                          onClick={() => handleFileClick(url)}
                          className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          {getFileIcon(url)}
                          <span className="text-xs text-gray-700">
                            {getFileName(url)}
                          </span>
                        </div>
                      ))}
                  </div>
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
            onCommentPosted={() => {
              queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
            }}
          />
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <div className="w-full h-[80vh] flex items-center justify-center bg-gray-50">
            {selectedImage && (
              <div className="flex items-center justify-center w-full h-full">
                {selectedImage.endsWith('.svg') ? (
                  <object
                    data={selectedImage}
                    type="image/svg+xml"
                    className="max-w-full max-h-full"
                  />
                ) : selectedImage.endsWith('.pdf') ? (
                
<embed
  src={`${selectedImage}#toolbar=0&navpanes=0&scrollbar=0`}
  type="application/pdf"
  className="w-full h-[80vh]"
/>



                
                ) : ['doc', 'docx', 'xls', 'xlsx'].some(ext => selectedImage.endsWith(`.${ext}`)) ? (
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedImage)}`}
                    className="w-full h-[80vh]"
                  />
                ) : (
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => e.currentTarget.src = "fallback-image.png"}
                  />
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskCommentThread;
