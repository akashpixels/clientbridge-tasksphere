
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

  // Get user name
  const getUserName = () => {
    if (message.user_profiles) {
      return `${message.user_profiles.first_name || ''} ${message.user_profiles.last_name || ''}`.trim();
    }
    return 'Unknown User';
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} max-w-[80%]`}>
        <Avatar className="w-8 h-8 mt-1">
          <AvatarFallback className={isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-300"}>
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        <div className={`mx-2 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          <div 
            className={`px-4 py-2 rounded-lg ${
              isCurrentUser 
                ? 'bg-blue-500 text-white rounded-tr-none' 
                : 'bg-gray-100 rounded-tl-none'
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
          </div>
          
          <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
            <span className="mr-2">{getUserName()}</span>
            <span>{format(new Date(message.created_at), 'MMM d, h:mmaaa')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
