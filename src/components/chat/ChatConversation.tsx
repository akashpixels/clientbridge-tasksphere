
import React from "react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send } from "lucide-react";
import { RealtimeChannel } from "@supabase/supabase-js";
import ChatMessage from "@/components/chat/ChatMessage";
import AttachmentHandler from "@/components/project-layouts/maintenance/comments/AttachmentHandler";
import PreviewDialog from "@/components/project-layouts/maintenance/comments/PreviewDialog";
import { format, isSameDay } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ChatHeader from "./ChatHeader";

interface ChatMessageType {
  id: string;
  sender_id: string;
  content: string;
  attachments: string[];
  created_at: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface MessageRead {
  message_id: string;
  user_id: string;
}

interface ConversationParticipant {
  user_id: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface ChatConversationProps {
  conversationId: string | null;
}

const ChatConversation: React.FC<ChatConversationProps> = ({ conversationId }) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [messageReads, setMessageReads] = useState<MessageRead[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // This effect runs when the conversation ID changes or when a user logs in
  useEffect(() => {
    if (!session?.user || !conversationId) return;

    // If we're switching conversations, clear messages and set loading
    setMessages([]);
    setIsLoading(true);

    const fetchConversationData = async () => {
      try {
        // Get conversation participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            user_profiles (
              first_name,
              last_name
            )
          `)
          .eq('conversation_id', conversationId);

        if (participantsError) throw participantsError;
        setParticipants(participantsData);

        // Get conversation details
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .select('title')
          .eq('id', conversationId)
          .single();

        if (conversationError) throw conversationError;
        setConversationTitle(conversationData.title);

        // Get messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select(`
            *,
            user_profiles(first_name, last_name)
          `)
          .eq('conversation_id', conversationId)
          .order("created_at", { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData);

        // Get message reads
        const { data: readData, error: readError } = await supabase
          .from('message_reads')
          .select('message_id, user_id')
          .in('message_id', messagesData.map((m: any) => m.id));

        if (readError) throw readError;
        setMessageReads(readData || []);

        // Mark all messages as read
        await markAllMessagesAsRead(messagesData);
      } catch (error) {
        console.error("Error fetching conversation data:", error);
        toast({
          title: "Error loading conversation",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if we have a valid conversation ID
    if (conversationId) {
      fetchConversationData();
    }

    const setupRealtimeSubscription = () => {
      // Clean up any existing subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel(`chat-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${conversationId}`
          },
          async (payload) => {
            console.log("Realtime chat update:", payload);
            if (payload.eventType === "INSERT") {
              const { data } = await supabase
                .from('chat_messages')
                .select(`
                  *,
                  user_profiles(first_name, last_name)
                `)
                .eq("id", payload.new.id)
                .single();

              if (data) {
                setMessages((prevMessages) => [...prevMessages, data]);
                
                if (data.sender_id !== session.user?.id) {
                  await markMessageAsRead(data.id);
                }
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "message_reads",
          },
          (payload) => {
            console.log("Message read update:", payload);
            const newRead = {
              message_id: payload.new.message_id,
              user_id: payload.new.user_id
            };
            
            setMessageReads(prev => {
              // Only add if it doesn't already exist
              if (!prev.some(r => r.message_id === newRead.message_id && r.user_id === newRead.user_id)) {
                return [...prev, newRead];
              }
              return prev;
            });
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    if (conversationId) {
      setupRealtimeSubscription();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, session?.user, toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const markAllMessagesAsRead = async (messagesData: any[] = []) => {
    if (!session?.user?.id || !conversationId) return;

    const msgsToMark = messagesData.length > 0 ? messagesData : messages;
    if (msgsToMark.length === 0) return;

    try {
      // Get message IDs that aren't from the current user and haven't been read yet
      const messagesToMark = msgsToMark
        .filter(msg => msg.sender_id !== session.user.id)
        .filter(msg => !messageReads.some(read => 
          read.message_id === msg.id && read.user_id === session.user.id
        ))
        .map(msg => msg.id);

      if (messagesToMark.length === 0) return;

      // Insert reads for all these messages
      const reads = messagesToMark.map(messageId => ({
        message_id: messageId,
        user_id: session.user.id,
        read_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('message_reads')
        .upsert(reads, { onConflict: 'message_id,user_id' });

      if (error) throw error;
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    if (!session?.user?.id) return;

    try {
      await supabase.from('message_reads').upsert(
        {
          message_id: messageId,
          user_id: session.user.id,
          read_at: new Date().toISOString(),
        },
        { onConflict: "message_id,user_id" }
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const isMessageRead = (messageId: string) => {
    if (!session?.user?.id) return false;
    
    const senderMessage = messages.find(m => m.id === messageId);
    if (senderMessage?.sender_id === session.user.id) {
      // Check if at least one other participant has read it
      const otherParticipants = participants.filter(p => p.user_id !== session.user.id);
      
      return otherParticipants.some(participant =>
        messageReads.some(read => 
          read.message_id === messageId && 
          read.user_id === participant.user_id
        )
      );
    }
    
    return false;
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !session?.user?.id || !conversationId) return;

    setIsSubmitting(true);
    try {
      const uploadedFiles: string[] = [];

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileName = `${Date.now()}_${file.name}`;
          const filePath = `${session.user.id}/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("chat_attachment") 
            .upload(filePath, file);

          if (uploadError) {
            throw uploadError;
          }

          if (uploadData) {
            const { data: urlData } = supabase.storage
              .from("chat_attachment")
              .getPublicUrl(filePath);
            
            uploadedFiles.push(urlData.publicUrl);
          }
        }
      }

      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: session.user.id,
          conversation_id: conversationId,
          content: newMessage.trim() || (uploadedFiles.length > 0 ? "Attached files" : ""),
          attachments: uploadedFiles,
        });

      if (messageError) throw messageError;

      setNewMessage("");
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileClick = (url: string) => {
    setSelectedImage(url);
  };

  const handleDownload = async (url: string) => {
    if (!url) return;

    try {
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const renderMessages = () => {
    if (messages.length === 0) return null;
    
    let currentDate = '';
    
    return messages.map((message, index) => {
      const messageDate = new Date(message.created_at);
      const dateStr = format(messageDate, 'EEE, dd MMM');
      
      const showDateSeparator = index === 0 || 
        !isSameDay(messageDate, new Date(messages[index - 1].created_at));
      
      if (showDateSeparator) {
        currentDate = dateStr;
      }
      
      return (
        <div key={message.id}>
          {showDateSeparator && (
            <div className="flex justify-center my-4">
              <div className="px-3 py-1 text-xs text-muted-foreground bg-muted rounded-full">
                {currentDate}
              </div>
            </div>
          )}
          <ChatMessage 
            message={message}
            isCurrentUser={message.sender_id === session?.user?.id}
            onFileClick={handleFileClick}
            isRead={isMessageRead(message.id)}
          />
        </div>
      );
    });
  };

  // Generate a display name for the conversation
  const getDisplayName = () => {
    if (conversationTitle) return conversationTitle;
    
    if (!session?.user?.id || participants.length === 0) return "Chat";
    
    const otherParticipants = participants.filter(p => p.user_id !== session.user.id);
    
    if (otherParticipants.length === 0) return "Chat with yourself";
    
    return otherParticipants
      .map(p => p.user_profiles ? `${p.user_profiles.first_name} ${p.user_profiles.last_name}` : "Unknown User")
      .join(", ");
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader userName={getDisplayName()} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !conversationId ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            Select a conversation to start chatting
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {renderMessages()}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {conversationId && (
        <div className="border-t p-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="resize-none"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="flex justify-end items-center gap-2">
              <AttachmentHandler
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
              />
              <Button
                type="button"
                onClick={handleSendMessage}
                disabled={isSubmitting || (!newMessage.trim() && selectedFiles.length === 0)}
                className="h-10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <PreviewDialog
        selectedImage={selectedImage}
        onClose={() => setSelectedImage(null)}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default ChatConversation;
