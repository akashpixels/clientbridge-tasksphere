import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Download } from "lucide-react";

const ImageViewer = ({
  image,
  onClose,
}: {
  image: string | null;
  onClose: () => void;
}) => {
  if (!image) return null;

  return (
    <Dialog open={!!image} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl pt-0">
        <div className="w-full flex justify-between items-center pt-3 pb-2 border-b">
          <button
            onClick={() => {
              const link = document.createElement("a");
              link.href = image;
              link.download = image.split("/").pop() || "download";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            <Download className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="w-full h-[80vh] flex items-center justify-center bg-gray-50">
          <img src={image} alt="Preview" className="max-w-full max-h-full object-contain" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;
