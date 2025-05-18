import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLayout } from "@/context/layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UploadCloud, X } from "lucide-react";

export const FileUploadSidebar = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { setRightSidebarContent } = useLayout();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fileType: '',
    description: '',
    file: null as File | null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [fileTypes, setFileTypes] = useState([
    { id: 1, name: 'Project Files' },
    { id: 2, name: 'Deliverables' },
    { id: 3, name: 'Inputs' },
    { id: 4, name: 'Credentials' },
  ]);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, fileType: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is missing",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.file) {
      toast({
        title: "Validation Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 1. First upload the file to storage
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `project-files/${projectId}/${fileName}`;
      
      // Start with 10% progress to indicate the upload has begun
      setUploadProgress(10);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, formData.file, {
          cacheControl: '3600',
          upsert: false
          // onUploadProgress is not supported in the Supabase SDK FileOptions
        });
      
      // Set progress to 50% after upload is complete
      setUploadProgress(50);
      
      if (uploadError) throw uploadError;
      
      // 2. Get the public URL for the uploaded file
      const { data: urlData } = await supabase.storage
        .from('files')
        .getPublicUrl(filePath);
      
      // Set progress to 75% after getting public URL
      setUploadProgress(75);
      
      const fileUrl = urlData.publicUrl;
      
      // 3. Save the file metadata to the database
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert([
          {
            project_id: projectId,
            file_name: formData.file.name,
            file_url: fileUrl,
            file_description: formData.description || null,
            file_type_id: formData.fileType ? parseInt(formData.fileType) : null,
            size: formData.file.size,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          }
        ])
        .select();
      
      // Set progress to 100% when everything is complete
      setUploadProgress(100);
      
      if (fileError) throw fileError;
      
      toast({
        title: "File Uploaded",
        description: `Successfully uploaded ${formData.file.name}`,
      });
      
      // Reset the form
      setFormData({
        fileType: '',
        description: '',
        file: null,
      });
      setUploadProgress(0);
      
      // Invalidate files query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      
      // Close the sidebar
      setRightSidebarContent(null);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className=" h-full flex flex-col">
      <div className="flex justify-between items-center px-4 border-b sticky top-0 z-20 py-2 bg-background">
        <h2 className="text-sm text-gray-500">Upload File</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setRightSidebarContent(null)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div 
          onClick={triggerFileInput}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            ${formData.file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-primary'}
          `}
        >
          {formData.file ? (
            <div className="space-y-2">
              <div className="text-green-600 flex justify-center">
                <UploadCloud className="h-10 w-10" />
              </div>
              <p className="font-medium">Selected File:</p>
              <p className="truncate text-sm">{formData.file.name}</p>
              <p className="text-xs text-gray-500">
                {(formData.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setFormData(prev => ({ ...prev, file: null }));
                }}
              >
                Select a different file
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-gray-400 flex justify-center">
                <UploadCloud className="h-10 w-10" />
              </div>
              <p className="font-medium">Click to select a file</p>
              <p className="text-xs text-gray-500">
                or drag and drop (max: 200MB)
              </p>
            </div>
          )}
        </div>

        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
        
        <div>
          <Label htmlFor="fileType">File Type</Label>
          <Select value={formData.fileType} onValueChange={handleFileTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select file type" />
            </SelectTrigger>
            <SelectContent>
              {fileTypes.map(type => (
                <SelectItem key={type.id} value={String(type.id)}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Brief description of this file"
            value={formData.description}
            onChange={handleTextChange}
            rows={3}
          />
        </div>
        
        <div className="flex flex-col pt-4">
          <Button 
            type="submit" 
            disabled={isLoading || !formData.file}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> 
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" /> 
                Upload File
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FileUploadSidebar;
