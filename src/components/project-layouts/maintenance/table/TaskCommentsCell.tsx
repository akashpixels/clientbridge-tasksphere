
import { TableCell } from "@/components/ui/table";
import { MessageSquare } from "lucide-react";

interface TaskCommentsCellProps {
  taskId: string;
  commentCount?: number;
  onCommentClick: (taskId: string) => void;
}

export const TaskCommentsCell = ({ taskId, commentCount, onCommentClick }: TaskCommentsCellProps) => {
  return (
    <TableCell>
      <div 
        className="cursor-pointer flex items-center gap-1 text-gray-600 hover:text-gray-900"
        onClick={() => onCommentClick(taskId)}
      >
        <MessageSquare className="w-4 h-4" />
        {commentCount && (
          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
            {commentCount}
          </span>
        )}
      </div>
    </TableCell>
  );
};
