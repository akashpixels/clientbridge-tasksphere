
import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLayout } from "@/context/layout";
import { X, Upload, File, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const FileUploadSidebar = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { closeRightSidebar } = useLayout();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArray);
    }
  };

  const uploadFiles = async () => {
    if (!projectId || selectedFiles.length === 0) return;

    setIsUploading(true);
    const uploaded: string[] = [];

    try {
      // Upload each file and store metadata in the files table
      for (const file of selectedFiles) {
        // Create a unique file path
        const filePath = `${projectId}/${Date.now()}_${file.name}`;
        
        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(filePath);

        // Store file metadata in the files table
        const { error: dbError } = await supabase
          .from('files')
          .insert({
            project_id: projectId,
            file_name: file.name,
            file_url: publicUrl,
            file_type_id: null,
            file_size: file.size
          });

        if (dbError) {
          throw dbError;
        }

        uploaded.push(file.name);
      }

      // Success!
      setUploadedFiles(uploaded);
      setSelectedFiles([]);

      // Invalidate the files query to refresh the files tab
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });

      toast({
        title: "Files uploaded",
        description: `Successfully uploaded ${uploaded.length} files`
      });
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast({
        title: "File upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadedFiles([]);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-4 border-b sticky top-0 z-20 py-2 bg-background">
        <h2 className="font-semibold text-[14px]">
          {uploadedFiles.length > 0 ? "Files Uploaded" : "Upload Files"}
        </h2>
        <Button variant="ghost" size="icon" onClick={closeRightSidebar}>
          <X size={18} />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          {uploadedFiles.length > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 text-sm mb-2">
                Successfully uploaded {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}:
              </p>
              <ul className="mt-2 space-y-1">
                {uploadedFiles.map((filename, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check size={14} className="text-green-600" />
                    {filename}
                  </li>
                ))}
              </ul>
              <div className="flex justify-end mt-4">
                <Button onClick={resetUpload}>
                  Upload More Files
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-gray-400" />
                  <p className="text-sm font-medium">
                    Drag files here or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Upload project files, documents, or images
                  </p>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <Label>Selected Files ({selectedFiles.length})</Label>
                  <div className="mt-2 space-y-2 max-h-60 overflow-auto border rounded-md p-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <File size={14} className="text-blue-500" />
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={uploadFiles} 
                      disabled={isUploading}
                      className="gap-2"
                    >
                      <Upload size={16} />
                      {isUploading ? "Uploading..." : "Upload Files"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
