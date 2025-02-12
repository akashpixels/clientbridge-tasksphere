
import { Textarea } from "@/components/ui/textarea";
import { CommentInputProps } from '../types';
import AttachmentHandler from '../AttachmentHandler';
import CommentSender from '../CommentSender';

const CommentInput = ({ 
  newComment, 
  setNewComment, 
  selectedFiles, 
  setSelectedFiles, 
  onCommentPosted,
  taskId 
}: CommentInputProps) => {
  return (
    <div className="border-t p-4">
      <Textarea 
        value={newComment} 
        onChange={(e) => setNewComment(e.target.value)} 
        placeholder="Write a comment..." 
      />
      
      <div className="flex items-center mt-2 justify-end gap-2">
        <AttachmentHandler 
          selectedFiles={selectedFiles} 
          setSelectedFiles={setSelectedFiles} 
        />
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
};

export default CommentInput;
