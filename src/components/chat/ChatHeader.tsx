
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

interface ChatHeaderProps {
  userName: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ userName }) => {
  // Generate initials from user name
  const getInitials = () => {
    return userName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex items-center justify-between p-3 border-b">
      <div className="flex items-center">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <h3 className="font-medium text-sm">{userName}</h3>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
      </div>

      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
