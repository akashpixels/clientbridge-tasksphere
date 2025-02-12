import { Paperclip } from "lucide-react";

interface AttachmentHandlerProps {
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
}

const AttachmentHandler = ({ selectedFiles, setSelectedFiles }: AttachmentHandlerProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Hidden File Input */}
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        id="comment-attachments"
        accept="image/*, .pdf, .doc, .docx, .xls, .xlsx"
      />

      {/* File Count (only if files are selected) */}
      {selectedFiles.length > 0 && (
        <span className="text-sm text-gray-500">{selectedFiles.length} file(s)</span>
      )}

      {/* Attachment Button */}
      <button
        onClick={() => document.getElementById("comment-attachments")?.click()}
        className="p-2 text-gray-500 hover:text-gray-800"
        title="Attach File"
      >
        <Paperclip className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AttachmentHandler;
