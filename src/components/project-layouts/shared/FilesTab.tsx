
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import PreviewDialog from "../maintenance/comments/PreviewDialog";
import { 
  File, 
  FileText, 
  FileImage, 
  FileVideo, 
  FileSpreadsheet, 
  FileCode, 
  FileArchive,
  FileType,
  FileChartLine 
} from "lucide-react";

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
    e.currentTarget.src = '';
    e.currentTarget.onerror = null;
    e.currentTarget.parentElement!.innerHTML = FileImage.toString();
  };

  return (
    <div 
      className="p-2 cursor-pointer"
      onClick={() => onFileClick(file.file_url)}
    >
      <div className="flex flex-col items-center">
        {isImageFile(file.file_url) ? (
          <div className="w-20 h-20 relative">
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

interface FilesTabProps {
  projectId: string;
}

const FilesTab = ({ projectId }: FilesTabProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: async () => {
      console.log('Fetching files for project:', projectId);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching files:', error);
        throw error;
      }

      // Group files by date
      const groupedFiles = data.reduce((groups: Record<string, typeof data>, file) => {
        const date = format(new Date(file.created_at), 'MMMM d, yyyy');
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(file);
        return groups;
      }, {});

      return groupedFiles;
    },
  });

  if (isLoading) {
    return <div>Loading files...</div>;
  }

  if (!files || Object.keys(files).length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">No files found for this project.</p>
        </div>
      </Card>
    );
  }

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card className="p-6">
      <div className="space-y-8">
        {Object.entries(files).map(([date, dateFiles]) => (
          <div key={date}>
            <h3 className="text-lg font-medium mb-4">{date}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {dateFiles.map((file) => (
                <FileCard 
                  key={file.id} 
                  file={file} 
                  onFileClick={setSelectedFile} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <PreviewDialog
        selectedImage={selectedFile}
        onClose={() => setSelectedFile(null)}
        onDownload={handleDownload}
      />
    </Card>
  );
};

export default FilesTab;
