
import { useState, useEffect } from 'react';
import { getUnreadMessageCount } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { session } = useAuth();
  
  useEffect(() => {
    if (!session?.user?.id) {
      setUnreadCount(0);
      return;
    }
    
    // Initial fetch
    const fetchUnreadCount = async () => {
      const count = await getUnreadMessageCount(session.user?.id);
      setUnreadCount(count);
    };
    
    fetchUnreadCount();
    
    // Subscribe to message changes
    const channel = supabase
      .channel('chat-notification')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          // If new message is not from current user, increment counter
          if (payload.new.sender_id !== session.user?.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads',
        },
        async (payload) => {
          // If current user read a message, update counter
          if (payload.new.user_id === session.user?.id) {
            const count = await getUnreadMessageCount(session.user?.id);
            setUnreadCount(count);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);
  
  const resetUnreadCount = () => {
    setUnreadCount(0);
  };
  
  return { unreadCount, resetUnreadCount };
};
