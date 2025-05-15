
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth";
import { Send } from "lucide-react";
import AttachmentHandler from "./AttachmentHandler";

interface CommentSenderProps {
  taskId: string;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  onCommentPosted: () => void;
  isRequestingInput?: boolean;
  isInputResponse?: boolean;
  parentCommentId?: string;
  placeholderText?: string;
}

const CommentSender = ({
  taskId,
  selectedFiles,
  setSelectedFiles,
  onCommentPosted,
  isRequestingInput = false,
  isInputResponse = false,
  parentCommentId,
  placeholderText = "Add a comment..."
}: CommentSenderProps) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const handleSubmit = async () => {
    if (!newComment.trim() && selectedFiles.length === 0) return;
    
    console.log("CommentSender: Session check", { sessionExists: !!session, userId: session?.user?.id });
    
    if (!session?.user?.id) {
      console.error("CommentSender: No user session found");
      toast({
        title: "Error", 
        description: "You must be logged in", 
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("CommentSender: Submitting comment", { 
        taskId, 
        userId: session.user.id,
        isRequestingInput,
        isInputResponse,
        parentCommentId,
        hasFiles: selectedFiles.length > 0
      });
      
      // Track timing for performance monitoring
      const startTime = performance.now();
      const uploadedFiles: string[] = [];

      // Upload each file to Supabase Storage
      if (selectedFiles.length > 0) {
        console.log(`CommentSender: Uploading ${selectedFiles.length} files`);
        for (const file of selectedFiles) {
          const fileName = `${Date.now()}_${file.name}`;
          const filePath = `task_comments/${taskId}/${fileName}`;
          
          console.log(`CommentSender: Uploading file ${fileName}`);
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("task-attachments")
            .upload(filePath, file);

          if (uploadError) {
            console.error("CommentSender: File upload error:", uploadError);
            throw uploadError;
          }

          if (uploadData) {
            const { data: urlData } = supabase.storage
              .from("task-attachments")
              .getPublicUrl(filePath);
            
            uploadedFiles.push(urlData.publicUrl);
            console.log(`CommentSender: File uploaded successfully, URL: ${urlData.publicUrl}`);
          }
        }
      }

      // Insert comment with files (if any)
      console.log("CommentSender: Inserting comment into database", {
        content: newComment,
        fileCount: uploadedFiles.length,
        isInputRequest: isRequestingInput,
        isInputResponse,
        user_id: session.user.id
      });
      
      const { data: commentData, error: commentError } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId,
          user_id: session.user.id,
          content: newComment.trim() || (uploadedFiles.length > 0 ? "Attached files" : ""),
          images: uploadedFiles,
          is_input_request: isRequestingInput,
          is_input_response: isInputResponse,
          parent_id: parentCommentId
        })
        .select();

      if (commentError) {
        console.error("CommentSender: Database error when posting comment:", commentError);
        throw commentError;
      }

      const endTime = performance.now();
      console.log(`CommentSender: Comment posted successfully in ${endTime - startTime}ms`, commentData);
      
      setNewComment("");
      setSelectedFiles([]);
      onCommentPosted();

      toast({ 
        title: isRequestingInput 
          ? "Input requested" 
          : isInputResponse
            ? "Response submitted"
            : "Comment posted successfully" 
      });
    } catch (error) {
      console.error("CommentSender: Error posting comment:", error);
      toast({ 
        title: "Error posting comment", 
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 space-y-2">
      <Textarea
        placeholder={
          isInputResponse 
            ? "Provide your input..." 
            : placeholderText
        }
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        className="resize-none"
        rows={3}
      />
      <div className="flex justify-between items-center">
        <AttachmentHandler 
          selectedFiles={selectedFiles} 
          setSelectedFiles={setSelectedFiles} 
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || (!newComment.trim() && selectedFiles.length === 0)}
          className="flex items-center gap-1"
        >
          <Send className="h-4 w-4" />
          {isSubmitting 
            ? "Sending..." 
            : isInputResponse 
              ? "Submit Input" 
              : "Send"}
        </Button>
      </div>
    </div>
  );
};

export default CommentSender;
