
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, X } from "lucide-react";

interface PreviewDialogProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onDownload?: (url: string) => void;
}

const PreviewDialog = ({ isOpen, imageUrl, onClose, onDownload }: PreviewDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative w-full h-full">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
          >
            <X size={20} />
          </button>
          
          {onDownload && imageUrl && (
            <button
              onClick={() => onDownload(imageUrl)}
              className="absolute top-2 left-2 z-10 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
            >
              <Download size={20} />
            </button>
          )}
          
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewDialog;
