
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  role: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface ChatUserItemProps {
  user: User;
  isSelected: boolean;
  onClick: () => void;
}

const ChatUserItem: React.FC<ChatUserItemProps> = ({ user, isSelected, onClick }) => {
  // Generate initials from name
  const getInitials = () => {
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div 
      className={cn(
        "flex items-center p-3 cursor-pointer hover:bg-accent transition-colors",
        isSelected && "bg-accent"
      )}
      onClick={onClick}
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary/10 text-primary">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      
      <div className="ml-3 flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <span className="font-medium truncate">{user.name}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{user.time}</span>
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-muted-foreground truncate">{user.lastMessage}</span>
          {user.unread > 0 && (
            <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground">
              {user.unread}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatUserItem;
