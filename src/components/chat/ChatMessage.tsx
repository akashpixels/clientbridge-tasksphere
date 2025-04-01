
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import FilePreview from "@/components/project-layouts/maintenance/comments/FilePreview";
import { Check } from "lucide-react";

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
  isRead?: boolean;
}

const ChatMessage = ({ message, isCurrentUser, onFileClick, isRead = false }: ChatMessageProps) => {
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
            
            <div className="flex items-center justify-end mt-1 space-x-1 text-[10px] text-muted-foreground">
              <span>
                {format(new Date(message.created_at), 'h:mm a')}
              </span>
              
              {isCurrentUser && (
                <div className="flex items-center ml-1">
                  {isRead ? (
                    // Blue double tick (read)
                    <>
                      <Check className="h-3 w-3 text-blue-500" strokeWidth={2} />
                      <Check className="h-3 w-3 text-blue-500 -ml-1.5" strokeWidth={2} />
                    </>
                  ) : (
                    // Grey double tick (delivered but not read)
                    <>
                      <Check className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
                      <Check className="h-3 w-3 text-muted-foreground -ml-1.5" strokeWidth={2} />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
