import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2, Paperclip, Send, AtSign, File, FileText, FileImage, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/components/auth/AuthProvider";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TaskCommentThreadProps {
  taskId: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  files: Array<{
    url: string;
    type: string;
    name: string;
  }> | null;
  user_profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

interface UserProfile {
  id: string;
  first_name: string;
}

interface FilePreview {
  url: string;
  type: string;
  name: string;
}

const TaskCommentThread = ({ taskId }: TaskCommentThreadProps) => {
  const [newComment, setNewComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTagPopover, setShowTagPopover] = useState(false);
  const [selectedFilePreview, setSelectedFilePreview] = useState<FilePreview | null>(null);
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, first_name');

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`
        },
        (payload) => {
          console.log('Comment change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, queryClient]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-8 w-8" />;
    if (type.includes('pdf')) return <FileText className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 10) {
        toast({
          title: "Too many files",
          description: "You can only upload up to 10 files at once",
          variant: "destructive",
        });
        return;
      }
      setSelectedFiles(files);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!newComment.trim() && selectedFiles.length === 0) return;
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to post comments",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const uploadedFiles: Array<{ url: string; type: string; name: string }> = [];

      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${taskId}/${crypto.randomUUID()}-${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('comment_attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('comment_attachments')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          url: publicUrl,
          type: file.type,
          name: file.name
        });
      }

      const { error: commentError } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          content: newComment,
          files: uploadedFiles,
          user_id: session.user.id,
        });

      if (commentError) throw commentError;

      setNewComment("");
      setSelectedFiles([]);
      
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
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm">
                    {comment.user_profiles?.first_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, h:mmaaa')}
                  </span>
                </div>
                
                <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
                
                {comment.files && comment.files.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {comment.files.map((file, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer border rounded-lg p-2 hover:bg-gray-50"
                        onClick={() => setSelectedFilePreview(file)}
                      >
                        <div className="flex flex-col items-center">
                          {getFileIcon(file.type)}
                          <span className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                            {file.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t bg-white mt-auto">
        <div className="p-4 space-y-2">
          <div className="relative">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />
            
            <Popover open={showTagPopover} onOpenChange={setShowTagPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setShowTagPopover(true)}
                >
                  <AtSign className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <ScrollArea className="h-64">
                  <div className="p-2">
                    {users?.map((user) => (
                      <Button
                        key={user.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleUserTag(user)}
                      >
                        @{user.first_name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group border rounded-lg p-2">
                  <button
                    onClick={() => removeSelectedFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex flex-col items-center">
                    {getFileIcon(file.type)}
                    <span className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                      {file.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="comment-attachments"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
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

      {/* File Preview Dialog */}
      <Dialog open={!!selectedFilePreview} onOpenChange={() => setSelectedFilePreview(null)}>
        <DialogContent className="max-w-4xl">
          <div className="w-full h-[80vh] flex items-center justify-center bg-gray-50">
            {selectedFilePreview && (
              selectedFilePreview.type.startsWith('image/') ? (
                <img
                  src={selectedFilePreview.url}
                  alt={selectedFilePreview.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <iframe
                  src={selectedFilePreview.url}
                  title={selectedFilePreview.name}
                  className="w-full h-full"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskCommentThread;
