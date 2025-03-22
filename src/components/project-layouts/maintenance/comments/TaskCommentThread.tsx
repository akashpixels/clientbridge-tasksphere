
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import CommentList from "./CommentList";
import AttachmentHandler from "./AttachmentHandler";
import CommentSender from "./CommentSender";
import CommentInputRequest from "./CommentInputRequest";
import PreviewDialog from "./PreviewDialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLayout } from "@/context/layout";

interface TaskCommentThreadProps {
  taskId: string;
  taskCode?: string;
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

const TaskCommentThread = ({ taskId, taskCode = "Task" }: TaskCommentThreadProps) => {
  const [newComment, setNewComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [respondingToComment, setRespondingToComment] = useState<string | null>(null);
  const [isRequestingInput, setIsRequestingInput] = useState(false);
  const queryClient = useQueryClient();
  const { closeRightSidebar } = useLayout();

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
    return <Loader2 className="w-6 h-6 animate-spin text-gray-500 m-auto p-6" />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background border-b sticky top-0 z-10">
        <div className="font-semibold">{taskCode}</div>
        <Button variant="ghost" size="icon" onClick={closeRightSidebar}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <CommentList 
            comments={comments} 
            onFileClick={handleFileClick}
          />
        </div>
      </ScrollArea>

      <div className="border-t p-4 bg-background sticky bottom-0 z-10">
        <CommentInputRequest
          isInputResponse={!!pendingInputRequest}
          isRequestingInput={isRequestingInput}
          setIsRequestingInput={setIsRequestingInput}
        />
        
        <CommentSender 
          taskId={taskId}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          isInputResponse={!!pendingInputRequest}
          parentCommentId={pendingInputRequest?.id}
          isRequestingInput={isRequestingInput}
          onCommentPosted={() => {
            queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
            setIsRequestingInput(false);
          }}
          placeholderText={pendingInputRequest ? "Provide input..." : "Add a comment..."}
        />
      </div>

      <PreviewDialog
        selectedImage={selectedImage}
        onClose={() => setSelectedImage(null)}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default TaskCommentThread;
