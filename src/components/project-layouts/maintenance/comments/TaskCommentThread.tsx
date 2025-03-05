
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import CommentList from "./CommentList";
import AttachmentHandler from "./AttachmentHandler";
import CommentSender from "./CommentSender";
import CommentInputRequest from "./CommentInputRequest";
import PreviewDialog from "./PreviewDialog";

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
  is_input_request?: boolean;
  is_input_response?: boolean;
  parent_id?: string;
}

const TaskCommentThread = ({ taskId }: TaskCommentThreadProps) => {
  const [newComment, setNewComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [respondingToComment, setRespondingToComment] = useState<string | null>(null);
  const [isRequestingInput, setIsRequestingInput] = useState(false);
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`id, content, created_at, user_profiles(first_name), images, is_input_request, is_input_response, parent_id`)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
  });

  // Find if there's any pending input request
  const pendingInputRequest = comments?.find(comment => 
    comment.is_input_request && 
    !comments.some(c => c.is_input_response && c.parent_id === comment.id)
  );

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    return;
  };

  const handleFileClick = (url: string) => {
    const fileExtension = url.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
    const isDocument = ['doc', 'docx', 'xls', 'xlsx', 'pdf'].includes(fileExtension || '');

    if (isImage || isDocument) {
      setSelectedImage(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleDownload = async (url: string) => {
    if (!url) return;

    const fileExtension = url.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');

    if (isImage) {
      try {
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = url.split('/').pop() || 'downloaded-image';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error("Failed to download image:", error);
        window.open(url, '_blank');
      }
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', url.split('/').pop() || 'file');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return <Loader2 className="w-6 h-6 animate-spin text-gray-500" />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <CommentList 
          comments={comments} 
          onFileClick={handleFileClick}
        />
      </div>

      <div className="border-t p-4 bg-white">
        <CommentInputRequest
          isInputResponse={!!pendingInputRequest}
          isRequestingInput={isRequestingInput}
          setIsRequestingInput={setIsRequestingInput}
        />
        
        <Textarea 
          value={newComment} 
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={pendingInputRequest ? "Provide input..." : "Add a comment..."} 
        />
        
        <div className="flex items-center mt-2 justify-end gap-2">
          <AttachmentHandler selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} />
          <CommentSender 
            taskId={taskId} 
            newComment={newComment} 
            setNewComment={setNewComment} 
            selectedFiles={selectedFiles} 
            setSelectedFiles={setSelectedFiles}
            isInputResponse={!!pendingInputRequest}
            parentCommentId={pendingInputRequest?.id}
            isRequestingInput={isRequestingInput}
            onCommentPosted={() => {
              queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
              setIsRequestingInput(false);
            }}
          />
        </div>
      </div>

      <PreviewDialog
        selectedImage={selectedImage}
        onClose={() => setSelectedImage(null)}
        onDownload={handleDownload}
      />

      <style>
        {`
          .max-w-4xl svg.lucide.lucide-x.h-4.w-4 {
            display: none !important;
          }
        `}
      </style>
    </div>
  );
};

export default TaskCommentThread;
