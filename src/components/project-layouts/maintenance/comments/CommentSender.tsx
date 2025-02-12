import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Send } from "lucide-react"; // Import Send icon

interface CommentSenderProps {
  taskId: string;
  newComment: string;
  setNewComment: (text: string) => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  onCommentPosted: () => void;
}

const CommentSender = ({ 
  taskId, newComment, setNewComment, selectedFiles, setSelectedFiles, onCommentPosted 
}: CommentSenderProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const handleSubmit = async () => {
    if (!newComment.trim() && selectedFiles.length === 0) return;
    if (!session?.user?.id) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedFiles: string[] = [];

      // Upload each file to Supabase Storage
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${taskId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('comment_attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('comment_attachments')
          .getPublicUrl(filePath);

        uploadedFiles.push(publicUrl);
      }

      // Insert comment with attachments
      const { error: commentError } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          content: newComment,
          images: uploadedFiles,
          user_id: session.user.id,
        });

      if (commentError) throw commentError;

      setNewComment("");
      setSelectedFiles([]);
      onCommentPosted();

      toast({ title: "Comment posted successfully" });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({ title: "Error posting comment", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button 
      onClick={handleSubmit} 
      disabled={isSubmitting || (!newComment.trim() && selectedFiles.length === 0)}
      size="icon" // Ensures square button size
      className="p-2 w-10 h-10 flex items-center justify-center"
    >
      {isSubmitting ? (
        <span className="animate-spin">⏳</span> // Loader effect
      ) : (
        <Send className="h-4 w-4" /> // Send Icon
      )}
    </Button>
  );
};

export default CommentSender;
