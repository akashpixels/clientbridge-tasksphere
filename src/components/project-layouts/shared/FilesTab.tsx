
import { useState, useEffect } from "react";
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
              onError={(e) => {
                console.log(`Error loading image: ${file.file_url}`);
                e.currentTarget.src = '/placeholder.svg';
              }}
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
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);

  // Debug query directly to check if data exists
  useEffect(() => {
    const checkFilesDirectly = async () => {
      try {
        console.log("Running debug query for project ID:", projectId);
        
        // Try different query approaches
        const approaches = [
          { name: "Direct UUID", query: () => supabase.from('files').select('*').eq('project_id', projectId) },
          { name: "String UUID", query: () => supabase.from('files').select('*').eq('project_id', String(projectId)) },
          { name: "Text UUID", query: () => supabase.from('files').select('*').filter('project_id::text', 'eq', projectId) },
          { name: "Raw SQL", query: () => supabase.rpc('get_files_for_project', { p_project_id: projectId }) }
        ];
        
        let successfulApproach = null;
        let foundData = null;
        
        for (const approach of approaches) {
          try {
            const { data, error } = await approach.query();
            console.log(`${approach.name} approach:`, { data, error });
            
            if (!error && data && data.length > 0) {
              successfulApproach = approach.name;
              foundData = data;
              break;
            }
          } catch (err) {
            console.error(`Error with ${approach.name} approach:`, err);
          }
        }
        
        if (successfulApproach) {
          console.log(`Found data with ${successfulApproach} approach:`, foundData);
          setDebugInfo(`Found ${foundData?.length} files using ${successfulApproach} approach. Data: ${JSON.stringify(foundData)}`);
          
          // If we're on attempt 2+, trigger a refetch of the main query with the successful approach
          if (attemptCount > 0) {
            setAttemptCount(prev => prev + 1);
          }
        } else {
          const { data, error } = await supabase.from('files').select('*');
          console.log("All files in table:", data);
          
          const projects = await supabase.from('projects').select('id, name');
          console.log("All projects:", projects.data);
          
          setDebugInfo(`No files found with any approach. All files in table: ${data?.length || 0}. Raw project ID: ${projectId}. First file project_id (if exists): ${data && data.length > 0 ? data[0].project_id : 'none'}`);
        }
      } catch (err) {
        console.error("Debug query exception:", err);
        setDebugInfo(`Debug exception: ${(err as Error).message}`);
      }
    };

    checkFilesDirectly();
  }, [projectId, attemptCount]);

  // First, create the RPC function if it doesn't exist yet
  useEffect(() => {
    const createRpcFunction = async () => {
      try {
        console.log("Setting up RPC function for file queries");
        
        // Check if the function exists first by calling it
        const testCall = await supabase.rpc('get_files_for_project', { p_project_id: projectId });
        if (!testCall.error || !testCall.error.message.includes("function get_files_for_project() does not exist")) {
          console.log("RPC function already exists or different error");
          return;
        }
        
        // If we get here, the function doesn't exist
        const { error } = await supabase.rpc('create_get_files_function');
        if (error) {
          console.error("Error creating RPC function:", error);
        } else {
          console.log("Successfully created RPC function");
          // Increment attempt count to trigger a query refresh
          setAttemptCount(1);
        }
      } catch (err) {
        console.error("Exception in createRpcFunction:", err);
      }
    };
    
    createRpcFunction();
  }, [projectId]);

  const { data: files, isLoading, error } = useQuery({
    queryKey: ['project-files', projectId, attemptCount],
    queryFn: async () => {
      console.log('Fetching files for project:', projectId, 'Attempt:', attemptCount);
      
      try {
        let data;
        let error;
        
        // Use different approaches based on attempt count
        if (attemptCount >= 2) {
          // Use the RPC function on later attempts
          const result = await supabase.rpc('get_files_for_project', { p_project_id: projectId });
          data = result.data;
          error = result.error;
        } else {
          // Default approach
          const result = await supabase
            .from('files')
            .select('*')
            .eq('project_id', projectId);
          
          data = result.data;
          error = result.error;
        }

        if (error) {
          console.error('Error fetching files:', error);
          throw error;
        }

        console.log('Fetched files data:', data);

        if (!data || data.length === 0) {
          console.log('No files found for project ID:', projectId);
          return {};
        }

        // Group files by date
        const groupedFiles = data.reduce((groups: Record<string, any[]>, file) => {
          if (!file.created_at) {
            console.warn('File missing created_at:', file);
            return groups;
          }
          
          const date = format(new Date(file.created_at), 'MMMM d, yyyy');
          if (!groups[date]) {
            groups[date] = [];
          }
          groups[date].push(file);
          return groups;
        }, {});

        return groupedFiles;
      } catch (err) {
        console.error("Exception in queryFn:", err);
        throw err;
      }
    },
  });

  if (isLoading) {
    return <div>Loading files...</div>;
  }

  if (error) {
    console.error("Error loading files:", error);
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-red-500">Error loading files. Please try again.</p>
          <p className="text-sm text-gray-500 mt-2">{(error as Error).message}</p>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-left overflow-auto max-h-40">
              <p className="text-xs font-mono">{debugInfo}</p>
            </div>
          )}
          <button 
            onClick={() => setAttemptCount(prev => prev + 1)} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Another Approach
          </button>
        </div>
      </Card>
    );
  }

  if (!files || Object.keys(files).length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">No files found for this project (ID: {projectId}).</p>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-left overflow-auto max-h-40">
              <p className="text-xs font-mono">{debugInfo}</p>
            </div>
          )}
          <button 
            onClick={() => setAttemptCount(prev => prev + 1)} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Another Approach
          </button>
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
