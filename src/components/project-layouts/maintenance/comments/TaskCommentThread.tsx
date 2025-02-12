import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import CommentList from "./CommentList";
import CommentInput from "./CommentInput";
import ImageViewer from "./ImageViewer";

interface TaskCommentThreadProps {
  taskId: string;
}

const TaskCommentThread = ({ taskId }: TaskCommentThreadProps) => {
  const [newComment, setNewComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("task_comments")
      .select("id, content, created_at, user_profiles(first_name), images")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  };

  const { data: comments, isLoading } = useQuery({
    queryKey: ["taskComments", taskId],
    queryFn: fetchComments,
  });

  useEffect(() => {
    const channel = supabase
      .channel("comments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${taskId}` },
        () => queryClient.invalidateQueries(["taskComments", taskId])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [taskId, queryClient]);

  const handleFileClick = useCallback((url: string) => {
    const fileExtension = url.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(fileExtension || "")) {
      setSelectedImage(url);
    } else {
      window.open(url, "_blank");
    }
  }, []);

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin text-gray-500" />;

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4 space-y-4">
        <CommentList comments={comments} onFileClick={handleFileClick} />
      </ScrollArea>

      <CommentInput
        newComment={newComment}
        setNewComment={setNewComment}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        taskId={taskId}
        onCommentPosted={() => queryClient.invalidateQueries(["taskComments", taskId])}
      />

      <ImageViewer image={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
};

export default TaskCommentThread;
