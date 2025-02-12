import { Textarea } from "@/components/ui/textarea";
import AttachmentHandler from "./AttachmentHandler";
import CommentSender from "./CommentSender";

const CommentInput = ({
  newComment,
  setNewComment,
  selectedFiles,
  setSelectedFiles,
  taskId,
  onCommentPosted,
}: {
  newComment: string;
  setNewComment: (value: string) => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  taskId: string;
  onCommentPosted: () => void;
}) => (
  <div className="border-t p-4">
    <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." />

    <div className="flex items-center mt-2 justify-end gap-2">
      <AttachmentHandler selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} />
      <CommentSender
        taskId={taskId}
        newComment={newComment}
        setNewComment={setNewComment}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        onCommentPosted={onCommentPosted}
      />
    </div>
  </div>
);

export default CommentInput;
