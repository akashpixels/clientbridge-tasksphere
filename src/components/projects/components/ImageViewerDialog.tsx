
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ImageViewerDialogProps {
  selectedImage: string | null;
  selectedTaskImages: string[];
  currentImageIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

const ImageViewerDialog = ({
  selectedImage,
  selectedTaskImages,
  currentImageIndex,
  onClose,
  onPrevious,
  onNext,
}: ImageViewerDialogProps) => {
  return (
    <Dialog open={!!selectedImage} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <div className="relative flex-1 min-h-0 flex items-center justify-center">
          {selectedImage && (
            <>
              <button
                onClick={onPrevious}
                className="absolute left-4 p-2 bg-white/80 rounded-full"
                disabled={currentImageIndex === 0}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <img 
                src={selectedImage} 
                alt="Task image"
                className="max-w-full max-h-[calc(80vh-4rem)] object-contain"
              />
              <button
                onClick={onNext}
                className="absolute right-4 p-2 bg-white/80 rounded-full"
                disabled={currentImageIndex === selectedTaskImages.length - 1}
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewerDialog;
