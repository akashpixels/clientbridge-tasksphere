
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CommentItem from "./CommentItem";

// Updated interface to match TaskCommentThread.tsx structure
interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_profiles?: {
    first_name: string;
  } | null;
  user?: {
    first_name: string;
    last_name: string;
  } | null;
  images: string[] | null;
  is_input_request?: boolean;
  is_input_response?: boolean;
}

interface CommentListProps {
  comments: Comment[] | undefined;
  onFileClick: (url: string) => void;
}

const CommentList = ({ comments, onFileClick }: CommentListProps) => {
  return (
    <ScrollArea className="flex-1 p-4 space-y-5 hide-scrollbar">
      <div className="space-y-5">
      {comments?.map((comment, index) => (
        <div key={comment.id}>
          {/* Add a subtle divider when the user changes or after 10 minutes */}
          {index > 0 && (
            (comment.user_profiles?.first_name !== comments[index - 1]?.user_profiles?.first_name || 
             comment.user?.first_name !== comments[index - 1]?.user?.first_name ||
             new Date(comment.created_at).getTime() - new Date(comments[index - 1].created_at).getTime() > 600000)
          ) && (
            <div className="border-t border-gray-300 my-3 opacity-50"></div>
          )}

          {/* Render the comment item */}
          <CommentItem 
            comment={comment} 
            onFileClick={onFileClick}
          />
        </div>
      ))}
          </div>
    </ScrollArea>
  );
};

export default CommentList;
