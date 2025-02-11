import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2, Paperclip, Send, AtSign } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/components/auth/AuthProvider";

interface TaskCommentThreadProps {
  taskId: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  images: string[] | null;
  user_profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

interface UserProfile {
  id: string;
  first_name: string;
}

const TaskCommentThread = ({ taskId }: TaskCommentThreadProps) => {
  const [newComment, setNewComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const [showTagPopover, setShowTagPopover] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          user_profiles:user_profiles!task_comments_user_id_fkey(
            first_name,
            last_name
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, first_name');

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`
        },
        (payload) => {
          console.log('Comment change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, queryClient]);

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    setSelectedFiles((prevFiles) => [...prevFiles, ...Array.from(e.target.files)]); // Append new files
  }
};

const handleRemoveFile = (index: number) => {
  setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index)); // Remove file from list
};


  const handleUserTag = (user: UserProfile) => {
    setNewComment(prev => `${prev}@${user.first_name} `);
    setShowTagPopover(false);
  };

const handleSubmit = async () => {
  if (!newComment.trim() && selectedFiles.length === 0) return;
  if (!session?.user?.id) {
    toast({
      title: "Error",
      description: "You must be logged in to post comments",
      variant: "destructive",
    });
    return;
  }

  setIsSubmitting(true);
  try {
    const uploadedFiles: string[] = [];

    // Upload each selected file
    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop();
      const filePath = `${taskId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('comment_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('comment_attachments')
        .getPublicUrl(filePath);

      uploadedFiles.push(publicUrl);
    }

    // Insert comment with attachments
    const { error: commentError } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        content: newComment,
        images: uploadedFiles, // Now supports all file types
        user_id: session.user.id,
      });

    if (commentError) throw commentError;

    setNewComment("");
    setSelectedFiles([]);

    toast({
      title: "Comment posted successfully",
      duration: 3000,
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    toast({
      title: "Error posting comment",
      variant: "destructive",
      duration: 3000,
    });
  } finally {
    setIsSubmitting(false);
  }
};


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold">Comments</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {comments?.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  {comment.user_profiles?.first_name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm">
                    {comment.user_profiles?.first_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, h:mmaaa')}
                  </span>
                </div>
                
                <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
                
                {comment.images && comment.images.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {comment.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Comment attachment ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t bg-white mt-auto">
        <div className="p-4 space-y-2">
          <div className="relative">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />
            
            <Popover open={showTagPopover} onOpenChange={setShowTagPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setShowTagPopover(true)}
                >
                  <AtSign className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <ScrollArea className="h-64">
                  <div className="p-2">
                    {users?.map((user) => (
                      <Button
                        key={user.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleUserTag(user)}
                      >
                        @{user.first_name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
          

<div className="flex justify-between items-center">
  {/* Hidden File Input Field (Always Exists) */}
  {/* Hidden File Input */}
<input
  type="file"
  multiple
  onChange={handleFileChange}
  className="hidden"
  id="comment-attachments"
  accept="image/*, .pdf, .doc, .docx, .xls, .xlsx"
/>


{/* Display Attached Files with Clickable Preview */}
{selectedFiles.length > 0 && (
  <div className="border p-2 rounded-md space-y-2">
    <p className="text-sm font-medium">Attached Files:</p>
    {selectedFiles.map((file, index) => {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(fileExt || "");
      const isPDF = fileExt === "pdf";
      const isDoc = ["doc", "docx"].includes(fileExt || "");
      const isExcel = ["xls", "xlsx"].includes(fileExt || "");

      return (
        <div key={index} className="flex items-center justify-between border-b pb-1">
          {/* Clickable Preview for Images */}
          {isImage ? (
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-16 h-16 object-cover rounded-md cursor-pointer"
              onClick={() => setSelectedFile(URL.createObjectURL(file))}
            />
          ) : (
            // Clickable Link for PDFs, Docs, and Excel
            <a
              href={URL.createObjectURL(file)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-500 hover:underline"
            >
              {/* File Type Icon */}
              {isPDF && "📄 PDF"}
              {isDoc && "📝 Word Document"}
              {isExcel && "📊 Excel File"}
              {!isImage && !isPDF && !isDoc && !isExcel && "📁 Other File"}
              <span className="text-sm truncate">{file.name}</span>
            </a>
          )}

          {/* Remove File Button */}
          <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(index)}>
            ❌
          </Button>
        </div>
      );
    })}
  </div>
)}



  {/* Right-aligned buttons */}
  <div className="flex gap-2 ml-auto">
    {/* Attachment Icon Button (Ensure input exists) */}
    <Button
      variant="outline"
      size="sm"
      className="p-2"
      onClick={() => document.getElementById('comment-attachments')?.click()}
    >
      <Paperclip className="h-4 w-4" />
    </Button>

    {/* Send Button */}
    <Button
      onClick={handleSubmit}
      disabled={isSubmitting || (!newComment.trim() && selectedFiles.length === 0)}
    >
      {isSubmitting ? "Sending..." : "Send"}
    </Button>
  </div>
</div>



          

        </div>
      </div>
      {/* Lightbox Modal for Viewing Images */}
<Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
  <DialogContent className="max-w-3xl flex flex-col">
    {selectedFile && (
      <img
        src={selectedFile}
        alt="Preview"
        className="w-full h-auto max-h-[80vh] object-contain"
      />
    )}
  </DialogContent>
</Dialog>

    </div>
  );
};

export default TaskCommentThread;
