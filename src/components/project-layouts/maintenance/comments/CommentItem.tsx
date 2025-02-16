
import React from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import FilePreview from "./FilePreview";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_profiles: {
    first_name: string;
  } | null;
  images: string[] | null;
}

interface CommentItemProps {
  comment: Comment;
  onFileClick: (url: string) => void;
}

const CommentItem = ({ comment, onFileClick }: CommentItemProps) => {
  // Split the content by newlines and map each line to a paragraph
  const formattedContent = comment.content.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < comment.content.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <div className="flex gap-3">
      <Avatar>
        <AvatarFallback>{comment.user_profiles?.first_name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <span className="text-xs text-gray-500">{comment.user_profiles?.first_name}</span>
        <span className="text-xs text-gray-500 ml-2">
          {format(new Date(comment.created_at), 'MMM d, h:mmaaa')}
        </span>
        <p className="text-sm mt-1 whitespace-pre-line">{formattedContent}</p>
        
        {comment.images && comment.images.length > 0 && (
          <FilePreview files={comment.images} onFileClick={onFileClick} />
        )}
      </div>
    </div>
  );
};

export default CommentItem;
