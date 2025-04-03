import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { RealtimeChannel } from "@supabase/supabase-js";
import ChatMessage from "@/components/chat/ChatMessage";
import AttachmentHandler from "@/components/project-layouts/maintenance/comments/AttachmentHandler";
import PreviewDialog from "@/components/project-layouts/maintenance/comments/PreviewDialog";
import { format, isSameDay } from "date-fns";

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

const Chat = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [messageReads, setMessageReads] = useState<MessageRead[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('chat_messages' as any)
          .select(`
            *,
            user_profiles(first_name, last_name)
          `)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages((data as unknown) as ChatMessageType[] || []);

        const { data: readData, error: readError } = await supabase
          .from('message_reads' as any)
          .select('message_id, user_id');

        if (readError) throw readError;
        setMessageReads((readData as unknown) as MessageRead[] || []);

        await markAllMessagesAsRead();
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error loading messages",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const setupRealtimeSubscription = () => {
      const channel = supabase
        .channel("chat-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_messages",
          },
          async (payload) => {
            console.log("Realtime chat update:", payload);
            if (payload.eventType === "INSERT") {
              const { data } = await supabase
                .from('chat_messages' as any)
                .select(`
                  *,
                  user_profiles(first_name, last_name)
                `)
                .eq("id", payload.new.id)
                .single();

              if (data) {
                const typedData = data as unknown as ChatMessageType;
                setMessages((prevMessages) => [...prevMessages, typedData]);
                
                if (typedData.sender_id !== session.user?.id) {
                  await markMessageAsRead(typedData.id);
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
            setMessageReads(prev => [
              ...prev,
              { message_id: payload.new.message_id, user_id: payload.new.user_id } as MessageRead
            ]);
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    fetchMessages();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [session?.user, toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const markAllMessagesAsRead = async () => {
    if (!session?.user?.id) return;

    try {
      const { data: unreadMessages } = await supabase
        .from('chat_messages' as any)
        .select("id")
        .not("id", "in", supabase
          .from('message_reads' as any)
          .select("message_id")
          .eq("user_id", session.user.id)
        );

      if (!unreadMessages || unreadMessages.length === 0) return;

      for (const msg of unreadMessages) {
        await markMessageAsRead((msg as any).id);
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    if (!session?.user?.id) return;

    try {
      await supabase.from('message_reads' as any).upsert(
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
      return messageReads.some(read => 
        read.message_id === messageId && 
        read.user_id !== session.user.id
      );
    }
    
    return false;
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !session?.user?.id) return;

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
        .from('chat_messages' as any)
        .insert({
          sender_id: session.user.id,
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

  return (
    <div className="container mx-auto px-4 py-6 flex items-center justify-center h-screen">
      <Card className="flex flex-col h-[90vh] max-w-[600px] w-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      </Card>

      <PreviewDialog
        selectedImage={selectedImage}
        onClose={() => setSelectedImage(null)}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default Chat;
