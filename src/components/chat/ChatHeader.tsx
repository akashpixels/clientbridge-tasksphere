
import React from 'react';

interface ChatHeaderProps {
  userName: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ userName }) => {
  return (
    <div className="border-b p-3 flex items-center bg-card">
      <div className="flex-grow">
        <h3 className="text-lg font-medium">{userName}</h3>
      </div>
    </div>
  );
};

export default ChatHeader;
