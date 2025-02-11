import { Paperclip, FileText, FileImage, FilePdf, FileSpreadsheet, FileWord } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttachmentHandlerProps {
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
}

// Function to return the appropriate icon for each file type
const getFileTypeIcon = (file: File) => {
  const fileType = file.type;

  if (fileType.startsWith("image/")) return <FileImage className="h-4 w-4 text-gray-500" />;
  if (fileType.includes("pdf")) return <FilePdf className="h-4 w-4 text-red-500" />;
  if (fileType.includes("excel") || fileType.includes("spreadsheet")) return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  if (fileType.includes("word")) return <FileWord className="h-4 w-4 text-blue-500" />;
  return <FileText className="h-4 w-4 text-gray-500" />;
};

const AttachmentHandler = ({ selectedFiles, setSelectedFiles }: AttachmentHandlerProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
    }
  };

  return (
<div className="flex items-center justify-between gap-2 w-full">

      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        id="comment-attachments"
        accept="image/*, .pdf, .doc, .docx, .xls, .xlsx"
      />
      {selectedFiles.length > 0 && (
  <div className="flex -space-x-2 ml-auto">
    {selectedFiles.map((file, index) => (
      <div key={index} className="w-6 h-6 flex items-center justify-center border rounded-md bg-gray-100 shadow">
        {getFileTypeIcon(file)}
      </div>
    ))}
  </div>
)}

      <Button
        variant="outline"
        size="sm"
        className="p-2"
        onClick={() => document.getElementById('comment-attachments')?.click()}
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default AttachmentHandler;
