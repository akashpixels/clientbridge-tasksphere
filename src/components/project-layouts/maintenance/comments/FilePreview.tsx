
import { FileText, File } from "lucide-react";

interface FilePreviewProps {
  files: string[];
  onFileClick: (url: string) => void;
}

const FilePreview = ({ files, onFileClick }: FilePreviewProps) => {
  const getFileIcon = (url: string) => {
    const fileExtension = url.split('.').pop()?.toLowerCase();
    switch (fileExtension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-6 w-6 text-green-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const getFileName = (url: string) => {
    const fileName = decodeURIComponent(url.split('/').pop() || '');
    const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.')) || fileName;
    return nameWithoutExt.length <= 20 ? nameWithoutExt : `${nameWithoutExt.slice(0, 20)}...`;
  };

  const isImageFile = (url: string) => {
    const fileExtension = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
  };

  return (
    <div className="mt-2">
      {/* Image Preview */}
      <div className="flex items-center">
        {files
          .filter(url => isImageFile(url))
          .map((url, index) => (
            <div
              key={index}
              onClick={() => onFileClick(url)}
              className="relative w-12 h-12 cursor-pointer transition-transform hover:scale-105"
              style={{ marginLeft: index === 0 ? "0" : "-8px" }}
            >
              <img
                src={url}
                alt="Attachment"
                className="w-full h-full object-cover rounded-lg border"
              />
            </div>
          ))}
      </div>

      {/* Files Preview */}
      <div className="mt-2 flex flex-col space-y-2">
        {files
          .filter(url => !isImageFile(url))
          .map((url, index) => (
            <div
              key={index}
              onClick={() => onFileClick(url)}
              className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {getFileIcon(url)}
              <span className="text-xs text-gray-700">
                {getFileName(url)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default FilePreview;
