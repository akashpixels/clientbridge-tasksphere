
import { useState } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className={`flex items-center w-full ${selectedFiles.length > 0 ? "justify-between" : "justify-end"}`}>
      
      {/* Hidden File Input */}
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        id="comment-attachments"
        accept="image/*, .pdf, .doc, .docx, .xls, .xlsx"
      />

      {/* Right: File Count (only if files are selected) */}
      {selectedFiles.length > 0 && (
        <span className="text-sm text-gray-500">{selectedFiles.length} file(s) selected</span>
      )}

      {/* Left: Attachment Button (always aligned to the right when no files) */}
      <Button
        variant="outline"
        size="sm"
        className="p-2"
        onClick={() => document.getElementById("comment-attachments")?.click()}
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default AttachmentHandler;
