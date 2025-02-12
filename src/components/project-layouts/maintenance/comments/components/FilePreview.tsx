
import { FilePreviewProps } from '../types';
import { getFileIcon, getFileName } from '../utils/fileUtils';

const FilePreview = ({ files, onFileClick }: FilePreviewProps) => {
  return (
    <div className="mt-2 flex flex-col space-y-2">
      {files.map((url, index) => (
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
  );
};

export default FilePreview;
