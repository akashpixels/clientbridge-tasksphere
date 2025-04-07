
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import ChatUserItem from "./ChatUserItem";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface Conversation {
  id: string;
  title: string | null;
  last_message_at: string;
  participants: {
    user_id: string;
    user_profiles?: {
      first_name: string;
      last_name: string;
    } | null;
  }[];
  unread_count: number;
  last_message?: {
    content: string;
  } | null;
}

interface ChatUsersListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId: string | null;
}

const ChatUsersList: React.FC<ChatUsersListProps> = ({ onSelectConversation, selectedConversationId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const { toast } = useToast();
  
  // Load conversations the user is part of
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchConversations = async () => {
      setLoading(true);
      try {
        // Get conversations where the user is a participant
        const { data: participantData, error: participantError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            user_id,
            user_profiles (
              first_name,
              last_name
            ),
            conversations!inner (
              id,
              title,
              last_message_at
            )
          `)
          .eq('user_id', session.user.id);
          
        if (participantError) throw participantError;
        
        // Get unread count per conversation
        const { data: unreadData, error: unreadError } = await supabase
          .rpc('get_unread_messages_count', { user_id_param: session.user.id });
          
        if (unreadError) throw unreadError;
        
        // Get the last message for each conversation
        const conversationIds = participantData.map((p: any) => p.conversation_id);
        const { data: lastMessagesData, error: lastMessagesError } = await supabase
          .from('chat_messages')
          .select('conversation_id, content')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false })
          .limit(1, { foreignTable: 'conversations' });
          
        if (lastMessagesError) throw lastMessagesError;
        
        // Organize by conversation
        const conversationMap: Record<string, Conversation> = {};
        
        // First gather all conversations with basic info
        participantData.forEach((participant: any) => {
          const conversation = participant.conversations;
          if (!conversation) return;
          
          const conversationId = conversation.id;
          if (!conversationMap[conversationId]) {
            conversationMap[conversationId] = {
              id: conversationId,
              title: conversation.title,
              last_message_at: conversation.last_message_at,
              participants: [],
              unread_count: 0
            };
          }
          
          conversationMap[conversationId].participants.push({
            user_id: participant.user_id,
            user_profiles: participant.user_profiles
          });
        });
        
        // Add unread counts
        if (unreadData) {
          unreadData.forEach((unread: { conversation_id: string, unread_count: number }) => {
            if (conversationMap[unread.conversation_id]) {
              conversationMap[unread.conversation_id].unread_count = unread.unread_count;
            }
          });
        }
        
        // Add last messages
        if (lastMessagesData) {
          lastMessagesData.forEach((msg: { conversation_id: string, content: string }) => {
            if (conversationMap[msg.conversation_id]) {
              conversationMap[msg.conversation_id].last_message = {
                content: msg.content
              };
            }
          });
        }
        
        // Convert to array and sort by last message time
        const conversationList = Object.values(conversationMap).sort(
          (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );
        
        setConversations(conversationList);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast({
          title: "Failed to load conversations",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
    
    // Subscribe to conversation changes
    const channel = supabase
      .channel('conversation-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, toast]);
  
  // For now we'll use some mock data if no real conversations exist
  const useFallbackData = !loading && conversations.length === 0;
  
  // Filter conversations by search term
  const filteredConversations = conversations.filter(conversation => {
    // Simple title search
    return conversation.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      // Participant name search
      conversation.participants.some(p => 
        p.user_profiles?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user_profiles?.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  
  // Mock data for when no conversations exist yet
  const MOCK_USERS = useFallbackData ? [
    { id: "user1", name: "Agency Admin", role: "Admin", lastMessage: "Could you review the latest design?", time: "10:30 AM", unread: 2 },
    { id: "user2", name: "Client Manager", role: "Client", lastMessage: "Thanks for the update", time: "Yesterday", unread: 0 },
    { id: "user3", name: "Design Team", role: "Staff", lastMessage: "The assets are ready for review", time: "Yesterday", unread: 5 },
    { id: "user4", name: "Development Team", role: "Staff", lastMessage: "We'll deploy the changes tomorrow", time: "Monday", unread: 0 },
    { id: "user5", name: "Marketing Team", role: "Staff", lastMessage: "Campaign stats look good!", time: "Last week", unread: 0 },
  ] : [];

  const handleSelectUser = (userId: string) => {
    if (useFallbackData) {
      onSelectConversation(userId); // Just pass the mock ID for now
    } else {
      onSelectConversation(userId);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="divide-y">
            {useFallbackData ? (
              // Show mock data if no conversations
              MOCK_USERS
                .filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(user => (
                  <ChatUserItem
                    key={user.id}
                    user={user}
                    isSelected={user.id === selectedConversationId}
                    onClick={() => handleSelectUser(user.id)}
                  />
                ))
            ) : (
              // Show real conversations
              filteredConversations.map(conversation => {
                // Find the other participant(s) for the display name
                const otherParticipants = conversation.participants
                  .filter(p => p.user_id !== session?.user?.id);
                
                const displayName = conversation.title || 
                  otherParticipants.map(p => 
                    p.user_profiles ? 
                      `${p.user_profiles.first_name} ${p.user_profiles.last_name}` : 
                      "Unknown User"
                  ).join(", ") || 
                  "Unnamed Chat";
                
                // Format time
                const lastMessageTime = formatRelativeTime(conversation.last_message_at);
                
                const user = {
                  id: conversation.id,
                  name: displayName,
                  role: "User", // We could look up roles if needed
                  lastMessage: conversation.last_message?.content || "No messages yet",
                  time: lastMessageTime,
                  unread: conversation.unread_count
                };
                
                return (
                  <ChatUserItem
                    key={conversation.id}
                    user={user}
                    isSelected={conversation.id === selectedConversationId}
                    onClick={() => handleSelectUser(conversation.id)}
                  />
                );
              })
            )}
            
            {filteredConversations.length === 0 && !useFallbackData && (
              <div className="p-4 text-center text-muted-foreground">
                No contacts found
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    // Format as date
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }
};

export default ChatUsersList;
