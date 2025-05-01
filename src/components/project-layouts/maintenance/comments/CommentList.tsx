import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CommentItem from "./CommentItem";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_profiles: {
    first_name: string;
  } | null;
  images: string[] | null;
}

interface CommentListProps {
  comments: Comment[] | undefined;
  onFileClick: (url: string) => void;
}

const CommentList = ({ comments, onFileClick }: CommentListProps) => {
  return (
    <ScrollArea className="flex-1 p-4 space-y-2">
      {comments?.map((comment, index) => (
        <div key={comment.id} className="flex flex-col">

          {/* Add a subtle divider when the user changes or after 10 minutes */}
          {index > 0 && (comment.user_profiles?.first_name !== comments[index - 1]?.user_profiles?.first_name ||
            new Date(comment.created_at).getTime() - new Date(comments[index - 1].created_at).getTime() > 600000) && (
            <div className="border-t border-gray-300 my-2 opacity-50"></div>
          )}

          {/* Render the comment item */}
          <CommentItem 
            comment={comment} 
            onFileClick={onFileClick}
          />
        </div>
      ))}
    </ScrollArea>
  );
};

export default CommentList;
