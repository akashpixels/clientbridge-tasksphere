
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
}

const ImageViewerDialog = ({ open, onOpenChange, imageUrl }: ImageViewerDialogProps) => {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
        <div className="flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Full size preview"
            className="max-h-[80vh] max-w-full object-contain rounded-md shadow-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewerDialog;
