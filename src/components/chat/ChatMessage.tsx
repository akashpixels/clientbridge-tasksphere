
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import FilePreview from "@/components/project-layouts/maintenance/comments/FilePreview";

interface ChatMessageProps {
  message: {
    id: string;
    sender_id: string;
    content: string;
    attachments: string[];
    created_at: string;
    user_profiles?: {
      first_name: string;
      last_name: string;
    } | null;
  };
  isCurrentUser: boolean;
  onFileClick: (url: string) => void;
}

const ChatMessage = ({ message, isCurrentUser, onFileClick }: ChatMessageProps) => {
  const formattedContent = message.content.split('\n').map((line, index) => (
    <span key={index}>
      {line}
      {index < message.content.split('\n').length - 1 && <br />}
    </span>
  ));

  // Get initials for avatar
  const getInitials = () => {
    if (message.user_profiles) {
      const firstName = message.user_profiles.first_name || '';
      const lastName = message.user_profiles.last_name || '';
      return (firstName[0] || '') + (lastName[0] || '');
    }
    return '?';
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} max-w-[80%] group`}>
        {!isCurrentUser && (
          <Avatar className="w-8 h-8 mt-1 mr-2">
            <AvatarFallback className="bg-muted text-muted-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div>
          <div 
            className={`px-3 py-2 rounded-lg ${
              isCurrentUser 
                ? 'bg-muted text-foreground rounded-tr-none' 
                : 'bg-background text-foreground rounded-tl-none'
            }`}
          >
            <p className="text-sm whitespace-pre-line">{formattedContent}</p>
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2">
                <FilePreview 
                  files={message.attachments} 
                  onFileClick={onFileClick} 
                />
              </div>
            )}
            
            <span className="text-[10px] text-muted-foreground float-right ml-2 mt-1">
              {format(new Date(message.created_at), 'h:mm a')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
