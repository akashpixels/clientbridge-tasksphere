
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

interface ImageViewerDialogProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImageViewerDialog = ({
  images,
  initialIndex,
  open,
  onOpenChange,
}: ImageViewerDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <div className="relative flex-1 min-h-0 flex items-center justify-center">
          {images[currentIndex] && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 p-2 bg-white/80 rounded-full"
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <img 
                src={images[currentIndex]} 
                alt={`Task image ${currentIndex + 1}`}
                className="max-w-full max-h-[calc(80vh-4rem)] object-contain"
              />
              <button
                onClick={handleNext}
                className="absolute right-4 p-2 bg-white/80 rounded-full"
                disabled={currentIndex === images.length - 1}
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
