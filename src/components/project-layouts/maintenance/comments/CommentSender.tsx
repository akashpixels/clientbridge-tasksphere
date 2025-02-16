
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Send } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface CommentSenderProps {
  taskId: string;
  newComment: string;
  setNewComment: (text: string) => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  onCommentPosted: () => void;
  isInputRequest?: boolean;
  isInputResponse?: boolean;
  parentCommentId?: string;
}

const CommentSender = ({ 
  taskId, 
  newComment, 
  setNewComment, 
  selectedFiles, 
  setSelectedFiles, 
  onCommentPosted,
  isInputRequest,
  isInputResponse,
  parentCommentId
}: CommentSenderProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingInput, setIsRequestingInput] = useState(false);
  const [isAgencyUser, setIsAgencyUser] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user) {
        console.log("Checking user role for user:", session.user.id);
        
        // First, let's get the user profile with role information
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select(`
            id,
            user_role_id,
            user_roles!user_profiles_user_role_id_fkey (
              id,
              name
            )
          `)
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user role:", error);
          return;
        }

        console.log("Full user profile data:", userProfile);
        
        const isAgency = 
          userProfile?.user_roles?.name === 'Agency Admin' || 
          userProfile?.user_roles?.name === 'Agency Staff';
        
        console.log("Is agency user:", isAgency);
        console.log("Role name:", userProfile?.user_roles?.name);
        
        setIsAgencyUser(isAgency);
      }
    };

    checkUserRole();
  }, [session]);

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
          is_input_request: isRequestingInput,
          is_input_response: isInputResponse,
          parent_id: parentCommentId
        });

      if (commentError) throw commentError;

      setNewComment("");
      setSelectedFiles([]);
      setIsRequestingInput(false);
      onCommentPosted();

      toast({ title: isRequestingInput ? "Input requested" : "Comment posted successfully" });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({ title: "Error posting comment", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!isInputResponse && isAgencyUser && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="requestInput"
            checked={isRequestingInput}
            onCheckedChange={(checked) => setIsRequestingInput(checked as boolean)}
          />
          <label htmlFor="requestInput" className="text-sm text-gray-700 cursor-pointer">
            Request Input
          </label>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || (!newComment.trim() && selectedFiles.length === 0)}
          size="icon"
          className="p-2 w-12 h-9 flex items-center justify-center"
        >
          {isSubmitting ? <span className="animate-spin">⏳</span> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};


export default CommentSender;
