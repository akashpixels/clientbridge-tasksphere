
export interface TaskCommentThreadProps {
  taskId: string;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_profiles: {
    first_name: string;
  } | null;
  images: string[] | null;
}

export interface CommentListProps {
  comments: Comment[] | undefined;
  onFileClick: (url: string) => void;
}

export interface CommentItemProps {
  comment: Comment;
  onFileClick: (url: string) => void;
}

export interface ImagePreviewProps {
  images: string[];
  onImageClick: (url: string) => void;
}

export interface FilePreviewProps {
  files: string[];
  onFileClick: (url: string) => void;
}

export interface PreviewDialogProps {
  selectedImage: string | null;
  onClose: () => void;
  onDownload: (url: string) => void;
}

export interface CommentInputProps {
  newComment: string;
  setNewComment: (text: string) => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  onCommentPosted: () => void;
  taskId: string;
}
