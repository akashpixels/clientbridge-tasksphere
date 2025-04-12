
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
import { Json } from "@/integrations/supabase/types";

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

  const convertAttachmentsToStringArray = (attachments: Json | null): string[] => {
    if (!attachments) return [];
    
    if (Array.isArray(attachments)) {
      return attachments.map(item => String(item));
    }
    
    if (typeof attachments === 'string') {
      try {
        const parsed = JSON.parse(attachments);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item));
        }
        return [];
      } catch {
        return [attachments];
      }
    }
    
    return [];
  };

  useEffect(() => {
    if (!session?.user || !conversationId) return;

    setMessages([]);
    setIsLoading(true);

    const fetchConversationData = async () => {
      try {
        console.log("Fetching conversation data for ID:", conversationId);

        // First, check if the user is a participant in this conversation
        const { data: userParticipation, error: participationError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('conversation_id', conversationId)
          .eq('user_id', session.user.id)
          .single();

        if (participationError && participationError.code !== 'PGRST116') {
          console.error("Error checking user participation:", participationError);
          throw new Error("You don't have access to this conversation");
        }

        if (!userParticipation) {
          console.error("User is not a participant in this conversation");
          throw new Error("You don't have access to this conversation");
        }

        // Fetch conversation participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            user:user_id (
              profile:user_profiles (
                first_name,
                last_name
              )
            )
          `)
          .eq('conversation_id', conversationId);

        if (participantsError) {
          console.error("Error fetching participants:", participantsError);
          throw participantsError;
        }
        
        console.log("Raw participants data:", participantsData);
        
        // Transform the data structure to match our expected format
        const formattedParticipants: ConversationParticipant[] = participantsData?.map((p: any) => ({
          user_id: p.user_id,
          user_profiles: p.user?.profile || null
        })) || [];
        
        console.log("Formatted participants:", formattedParticipants);
        setParticipants(formattedParticipants);

        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .select('title')
          .eq('id', conversationId)
          .single();

        if (conversationError && conversationError.code !== 'PGRST116') {
          console.error("Error fetching conversation title:", conversationError);
          throw conversationError;
        }
        console.log("Conversation data:", conversationData);
        setConversationTitle(conversationData?.title || null);

        // Fetch messages with user profiles
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select(`
            id,
            sender_id,
            content,
            attachments,
            created_at,
            sender:sender_id (
              profile:user_profiles (
                first_name,
                last_name
              )
            )
          `)
          .eq('conversation_id', conversationId)
          .order("created_at", { ascending: true });

        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          throw messagesError;
        }
        console.log("Raw messages data:", messagesData);
        
        // Transform the data structure to match our expected format
        const formattedMessages: ChatMessageType[] = (messagesData || []).map((msg: any) => ({
          ...msg,
          attachments: convertAttachmentsToStringArray(msg.attachments),
          user_profiles: msg.sender?.profile || null
        }));
        
        console.log("Formatted messages:", formattedMessages);
        setMessages(formattedMessages);

        const { data: readData, error: readError } = await supabase
          .from('message_reads')
          .select('message_id, user_id')
          .in('message_id', formattedMessages.map((m: any) => m.id));

        if (readError) {
          console.error("Error fetching read receipts:", readError);
          throw readError;
        }
        console.log("Read receipts data:", readData);
        setMessageReads(readData || []);

        await markAllMessagesAsRead(formattedMessages);
      } catch (error) {
        console.error("Error fetching conversation data:", error);
        toast({
          title: "Error loading conversation",
          description: error instanceof Error ? error.message : "Failed to load conversation data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (conversationId) {
      fetchConversationData();
    }

    const setupRealtimeSubscription = () => {
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
              // Fetch the complete message with user profile
              const { data } = await supabase
                .from('chat_messages')
                .select(`
                  id,
                  sender_id,
                  content,
                  attachments,
                  created_at,
                  sender:sender_id (
                    profile:user_profiles (
                      first_name,
                      last_name
                    )
                  )
                `)
                .eq("id", payload.new.id)
                .single();

              if (data) {
                const formattedMessage: ChatMessageType = {
                  ...data,
                  attachments: convertAttachmentsToStringArray(data.attachments),
                  user_profiles: data.sender?.profile || null
                };
                
                setMessages((prevMessages) => [...prevMessages, formattedMessage]);
                
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
    // Auto-scroll to bottom when messages change
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
      const messagesToMark = msgsToMark
        .filter(msg => msg.sender_id !== session.user.id)
        .filter(msg => !messageReads.some(read => 
          read.message_id === msg.id && read.user_id === session.user.id
        ))
        .map(msg => msg.id);

      if (messagesToMark.length === 0) return;
      
      console.log("Marking messages as read:", messagesToMark);

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

      console.log("Sending message to conversation:", conversationId);
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
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
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
