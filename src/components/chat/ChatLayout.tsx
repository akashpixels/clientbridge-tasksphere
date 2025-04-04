
import React, { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import ChatUsersList from "./ChatUsersList";
import ChatConversation from "./ChatConversation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface ChatLayoutProps {
  children: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showConversation, setShowConversation] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Reset view when screen size changes
  useEffect(() => {
    if (!isMobile) {
      setShowConversation(false);
    }
  }, [isMobile]);

  const handleSelectUser = (userId: string) => {
    setSelectedUser(userId);
    if (isMobile) {
      setShowConversation(true);
    }
  };

  const handleBackToList = () => {
    setShowConversation(false);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden">
      {/* User list - Hidden on mobile when conversation is shown */}
      {(!isMobile || !showConversation) && (
        <div className="w-full md:w-1/3 border-r bg-card">
          <ChatUsersList onSelectUser={handleSelectUser} selectedUserId={selectedUser} />
        </div>
      )}

      {/* Conversation area - Full width on mobile, 2/3 on desktop */}
      {(!isMobile || showConversation) && (
        <div className="flex flex-col w-full md:w-2/3 bg-card">
          {isMobile && showConversation && (
            <div className="border-b p-2">
              <Button variant="ghost" size="sm" onClick={handleBackToList}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            {selectedUser || !isMobile ? (
              <ChatConversation />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatLayout;
