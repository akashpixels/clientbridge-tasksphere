import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import AttachmentHandler from "./AttachmentHandler";

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
    <div className="relative w-full">
      {/* Comment Box with Attachments and Send Button */}
      <div className="flex items-center w-full border border-gray-300 rounded-lg p-2 focus-within:ring-1 focus-within:ring-gray-400">
        
        {/* Input Field */}
        <textarea 
          value={newComment} 
          onChange={(e) => setNewComment(e.target.value)} 
          placeholder="Write a comment..."
          className="flex-1 resize-none border-none focus:ring-0 focus:outline-none p-2"
        />

        {/* Attachments & File Count */}
        <AttachmentHandler selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} />

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (!newComment.trim() && selectedFiles.length === 0)}
          className="p-2 text-gray-500 hover:text-gray-800 disabled:text-gray-300"
          title="Send Comment"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default CommentSender;
