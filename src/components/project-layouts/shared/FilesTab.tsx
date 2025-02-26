
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { FileIcon, ImageIcon, VideoIcon, AudioIcon, FileTextIcon } from "lucide-react";

interface FileCardProps {
  file: {
    id: string;
    file_name: string;
    file_url: string;
    created_at: string;
    file_type_id: number | null;
  };
}

const FileCard = ({ file }: FileCardProps) => {
  const getFileIcon = () => {
    const extension = file.file_name.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="w-12 h-12 text-blue-500" />;
    } else if (['mp4', 'webm', 'avi'].includes(extension || '')) {
      return <VideoIcon className="w-12 h-12 text-purple-500" />;
    } else if (['mp3', 'wav'].includes(extension || '')) {
      return <AudioIcon className="w-12 h-12 text-green-500" />;
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) {
      return <FileTextIcon className="w-12 h-12 text-red-500" />;
    }
    return <FileIcon className="w-12 h-12 text-gray-500" />;
  };

  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex flex-col items-center">
        {getFileIcon()}
        <p className="mt-2 text-sm text-center truncate max-w-full">
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

  return (
    <Card className="p-6">
      <div className="space-y-8">
        {Object.entries(files).map(([date, dateFiles]) => (
          <div key={date}>
            <h3 className="text-lg font-medium mb-4">{date}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {dateFiles.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default FilesTab;
