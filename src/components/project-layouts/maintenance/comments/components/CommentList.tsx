
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommentListProps } from '../types';
import CommentItem from './CommentItem';

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
