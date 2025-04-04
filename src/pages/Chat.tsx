
import { useEffect } from "react";
import { useAuth } from "@/context/auth";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import ChatLayout from "@/components/chat/ChatLayout";

const Chat = () => {
  const { session } = useAuth();
  const { resetUnreadCount } = useUnreadMessages();
  
  // Reset unread count when visiting the chat page
  useEffect(() => {
    if (session?.user) {
      resetUnreadCount();
    }
  }, [session?.user, resetUnreadCount]);

  return (
    <div className="h-full w-full">
      <ChatLayout>
        {/* Content will be rendered by the layout */}
      </ChatLayout>
    </div>
  );
};

export default Chat;
