import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, Paperclip, Send } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import CommentThread from "./CommentThread";
import { useToast } from "@/components/ui/use-toast";

interface CommentsSidebarProps {
  taskId: string;
  onClose: () => void;
  onCommentClick?: (taskId: string) => void; // Added prop with optional modifier
}

const CommentsSidebar = ({ taskId, onClose, onCommentClick }: CommentsSidebarProps) => {
  const [newComment, setNewComment] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      let fileUrl = null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('comment_attachments')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('comment_attachments')
          .getPublicUrl(fileName);

        fileUrl = publicUrl;
      }

      const { error } = await supabase
        .from('task_comments')
        .insert({
          content: newComment,
          task_id: taskId,
          file_url: fileUrl,
        });

      if (error) throw error;

      setNewComment("");
      setSelectedFile(null);
      
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
    <div className="fixed right-0 top-0 h-screen w-96 bg-background border-l border-border shadow-lg z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Comments</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-[calc(100vh-180px)] overflow-y-auto p-4">
        {isLoading ? (
          <p>Loading comments...</p>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments
              .filter(comment => !comment.parent_id)
              .map(comment => (
                <CommentThread 
                  key={comment.id} 
                  comment={comment} 
                  comments={comments}
                />
              ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No comments yet</p>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="flex flex-col gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[80px]"
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              {selectedFile && (
                <span className="text-sm text-muted-foreground">
                  {selectedFile.name}
                </span>
              )}
            </div>
            <Button onClick={handleSubmit}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsSidebar;
