
import React from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import FilePreview from "./FilePreview";
import { Badge } from "@/components/ui/badge";

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

interface CommentItemProps {
  comment: Comment;
  onFileClick: (url: string) => void;
}

const CommentItem = ({ comment, onFileClick }: CommentItemProps) => {
  // Get user's first name from either data structure
  const userName = comment.user_profiles?.first_name || comment.user?.first_name || "User";
  
  // Get user's first initial for avatar
  const userInitial = (comment.user_profiles?.first_name?.[0] || 
                       comment.user?.first_name?.[0] || 
                       "U");

  const formattedContent = comment.content.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < comment.content.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <div className={`p-3 rounded-lg ${comment.is_input_request ? 'bg-muted border' : ''} ${comment.is_input_response ? 'bg-muted border' : ''}`}>
      
      {/* New Row for Badges - Now Above Avatar */}
      {(comment.is_input_request || comment.is_input_response) && (
        <div className="mb-1 pb-2 flex justify-start">
          {comment.is_input_request && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              Input Requested
            </Badge>
          )}
          {comment.is_input_response && (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Input Provided
            </Badge>
          )}
        </div>
      )}

      {/* Avatar + Comment Content */}
      <div className="flex gap-3">
        <Avatar>
          <AvatarFallback>{userInitial}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          {/* Name and Timestamp */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{userName}</span>
            <span className="text-xs text-gray-300">
              {format(new Date(comment.created_at), 'MMM d, h:mmaaa')}
            </span>
          </div>

          {/* Comment Content */}
          <p className="text-sm mt-1 whitespace-pre-line">{formattedContent}</p>

          {/* File Previews if available */}
          {comment.images && comment.images.length > 0 && (
            <FilePreview files={comment.images} onFileClick={onFileClick} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
