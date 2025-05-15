
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { 
  File, 
  FileText, 
  FileImage, 
  FileVideo, 
  FileSpreadsheet, 
  FileCode, 
  FileArchive,
  FileType,
  FileChartLine,
  Loader2,
  AlertCircle,
  RefreshCw,
  Folder
} from "lucide-react";
import PreviewDialog from "../components/comments/PreviewDialog";

interface FileCardProps {
  file: {
    id: string;
    file_name: string;
    file_url: string;
    created_at: string;
    file_type_id: number | null;
  };
  onFileClick: (url: string) => void;
}

const FileCard = ({ file, onFileClick }: FileCardProps) => {
  const getFileIcon = (url: string) => {
    const fileExtension = url.split('.').pop()?.toLowerCase();
    switch (fileExtension) {
      case 'pdf':
        return <File className="w-20 h-20 stroke-[0.5] text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-20 h-20 stroke-[0.5] text-blue-500" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-20 h-20 stroke-[0.5] text-green-500" />;
      case 'ppt':
      case 'pptx':
      case 'key':
      case 'odp':
      case 'pps':
      case 'ppsx':
        return <FileChartLine className="w-20 h-20 stroke-[0.5] text-orange-500" />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <FileArchive className="w-20 h-20 stroke-[0.5] text-purple-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
      case 'mkv':
        return <FileVideo className="w-20 h-20 stroke-[0.5] text-blue-400" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'html':
      case 'css':
      case 'php':
      case 'py':
      case 'java':
      case 'cpp':
        return <FileCode className="w-20 h-20 stroke-[0.5] text-yellow-500" />;
      case 'txt':
      case 'rtf':
      case 'md':
        return <FileType className="w-20 h-20 stroke-[0.5] text-gray-500" />;
      default:
        return <File className="w-20 h-20 stroke-[0.5] text-gray-500" />;
    }
  };

  const isImageFile = (url: string) => {
    const fileExtension = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    
    const container = target.parentElement;
    if (container) {
      const icon = document.createElement('div');
      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" class="w-20 h-20 stroke-[0.5] text-blue-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="10" cy="13" r="2"></circle><path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"></path></svg>';
      container.appendChild(icon);
    }
  };

  return (
    <div 
      className="p-2 cursor-pointer"
      onClick={() => onFileClick(file.file_url)}
    >
      <div className="flex flex-col items-center">
        {isImageFile(file.file_url) ? (
          <div className="w-20 h-20 relative flex items-center justify-center bg-gray-100 rounded">
            <img
              src={file.file_url}
              alt={file.file_name}
              className="w-full h-full object-cover rounded"
              onError={handleImageError}
            />
          </div>
        ) : (
          getFileIcon(file.file_url)
        )}
        <p className="mt-2 text-sm text-center break-all line-clamp-2 w-24">
          {file.file_name}
        </p>
      </div>
    </div>
  );
};

interface FolderSectionProps {
  title: string;
  files: any[];
  onFileClick: (url: string) => void;
}

const FolderSection = ({ title, files, onFileClick }: FolderSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (files.length === 0) return null;

  return (
    <div className="mb-6">
      <div 
        className="flex items-center gap-2 mb-3 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Folder className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-medium">{title}</h3>
        <span className="text-sm text-gray-500">({files.length})</span>
      </div>
      
      {isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {files.map((file) => (
            <FileCard 
              key={file.id} 
              file={file} 
              onFileClick={onFileClick} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface FilesTabProps {
  projectId: string;
}

const FilesTab = ({ projectId }: FilesTabProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch files for this project
  const { data: files, isLoading, refetch } = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: async () => {
      console.log(`Fetching files for project: ${projectId}`);
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching files:', error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} files`);
      return data || [];
    },
  });

  // Group files by type
  const imageFiles = files?.filter(file => 
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.file_name)
  ) || [];
  
  const documentFiles = files?.filter(file => 
    /\.(pdf|doc|docx|txt|rtf|xls|xlsx|ppt|pptx)$/i.test(file.file_name)
  ) || [];
  
  const otherFiles = files?.filter(file => 
    !/\.(jpg|jpeg|png|gif|webp|svg|pdf|doc|docx|txt|rtf|xls|xlsx|ppt|pptx)$/i.test(file.file_name)
  ) || [];

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Project Files</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin h-10 w-10 text-primary mr-2" />
          <p>Loading files...</p>
        </div>
      ) : files && files.length > 0 ? (
        <div>
          <FolderSection 
            title="Images" 
            files={imageFiles} 
            onFileClick={(url) => setSelectedFile(url)} 
          />
          <FolderSection 
            title="Documents" 
            files={documentFiles} 
            onFileClick={(url) => setSelectedFile(url)} 
          />
          <FolderSection 
            title="Other Files" 
            files={otherFiles} 
            onFileClick={(url) => setSelectedFile(url)} 
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Files Found</h3>
          <p className="text-muted-foreground text-center mb-4">
            This project doesn't have any files yet. Use the "Add File" button to upload files.
          </p>
        </div>
      )}

      {/* File preview dialog */}
      <PreviewDialog
        isOpen={!!selectedFile}
        imageUrl={selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </div>
  );
};

export default FilesTab;
