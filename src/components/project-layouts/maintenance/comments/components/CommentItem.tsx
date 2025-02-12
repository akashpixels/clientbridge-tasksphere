
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommentItemProps } from '../types';
import { isImageFile } from '../utils/fileUtils';
import ImagePreview from './ImagePreview';
import FilePreview from './FilePreview';

const CommentItem = ({ comment, onFileClick }: CommentItemProps) => {
  const imageFiles = comment.images?.filter(isImageFile) || [];
  const documentFiles = comment.images?.filter(url => !isImageFile(url)) || [];

  return (
    <div className="flex gap-3">
      <Avatar>
        <AvatarFallback>{comment.user_profiles?.first_name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <span className="font-medium">{comment.user_profiles?.first_name}</span>
        <span className="text-xs text-gray-500 ml-2">
          {format(new Date(comment.created_at), 'MMM d, h:mmaaa')}
        </span>
        <p className="text-sm mt-1">{comment.content}</p>
        
        {comment.images && comment.images.length > 0 && (
          <div className="mt-2">
            {imageFiles.length > 0 && (
              <ImagePreview images={imageFiles} onImageClick={onFileClick} />
            )}
            {documentFiles.length > 0 && (
              <FilePreview files={documentFiles} onFileClick={onFileClick} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
