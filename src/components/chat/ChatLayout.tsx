
import React, { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import ChatUsersList from "./ChatUsersList";
import ChatConversation from "./ChatConversation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";

// Making children optional with ? since it's not actually being used
interface ChatLayoutProps {
  children?: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showConversation, setShowConversation] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { session } = useAuth();

  // Reset view when screen size changes
  useEffect(() => {
    if (!isMobile) {
      setShowConversation(false);
    }
  }, [isMobile]);

  // If there's only one conversation and we're not on mobile, select it by default
  useEffect(() => {
    if (!isMobile && !selectedConversationId && session?.user) {
      const fetchConversations = async () => {
        const { data: conversations } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', session.user.id)
          .limit(1);
          
        if (conversations && conversations.length === 1) {
          setSelectedConversationId(conversations[0].conversation_id);
        }
      };
      
      fetchConversations();
    }
  }, [isMobile, selectedConversationId, session?.user]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (isMobile) {
      setShowConversation(true);
    }
  };

  const handleBackToList = () => {
    setShowConversation(false);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* User list - Hidden on mobile when conversation is shown */}
      {(!isMobile || !showConversation) && (
        <div className="w-full md:w-1/3 border-r bg-card">
          <ChatUsersList 
            onSelectConversation={handleSelectConversation} 
            selectedConversationId={selectedConversationId} 
          />
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
            {selectedConversationId || !isMobile ? (
              <ChatConversation conversationId={selectedConversationId} />
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
