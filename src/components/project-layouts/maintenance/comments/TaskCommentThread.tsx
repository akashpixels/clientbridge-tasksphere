
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { TaskCommentThreadProps } from './types';
import { handleDownload } from './utils/fileUtils';
import CommentList from './components/CommentList';
import CommentInput from './components/CommentInput';
import PreviewDialog from './components/PreviewDialog';

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
      return data;
    },
  });

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

  if (isLoading) {
    return <Loader2 className="w-6 h-6 animate-spin text-gray-500" />;
  }

  return (
    <div className="flex flex-col h-full">
      <CommentList 
        comments={comments} 
        onFileClick={handleFileClick}
      />
      
      <CommentInput 
        newComment={newComment}
        setNewComment={setNewComment}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        taskId={taskId}
        onCommentPosted={() => {
          queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
        }}
      />

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
