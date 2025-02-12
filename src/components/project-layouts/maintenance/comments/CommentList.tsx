
import { format } from "date-fns";
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
    <ScrollArea className="flex-1 p-4 space-y-4">
      {comments?.map(comment => (
        <CommentItem 
          key={comment.id} 
          comment={comment} 
          onFileClick={onFileClick}
        />
      ))}
    </ScrollArea>
  );
};

export default CommentList;
