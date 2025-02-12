import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_profiles: { first_name: string } | null;
  images: string[] | null;
}

const CommentList = ({ comments, onFileClick }: { comments: Comment[]; onFileClick: (url: string) => void }) => (
  <>
    {comments.map((comment) => (
      <div key={comment.id} className="flex gap-3">
        <Avatar>
          <AvatarFallback>{comment.user_profiles?.first_name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <span className="font-medium">{comment.user_profiles?.first_name}</span>
          <span className="text-xs text-gray-500 ml-2">
            {format(new Date(comment.created_at), "MMM d, h:mmaaa")}
          </span>
          <p className="text-sm mt-1">{comment.content}</p>

          {comment.images?.length > 0 && (
            <div className="mt-2">
              {comment.images.map((url, index) => (
                <button key={index} onClick={() => onFileClick(url)} className="text-sm text-blue-500">
                  {url.split("/").pop()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    ))}
  </>
);

export default CommentList;
