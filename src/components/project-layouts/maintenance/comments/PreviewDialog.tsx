
import { X, Download } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PreviewDialogProps {
  selectedImage: string | null;
  onClose: () => void;
  onDownload: (url: string) => void;
}

const PreviewDialog = ({ selectedImage, onClose, onDownload }: PreviewDialogProps) => {
  if (!selectedImage) return null;

  return (
    <Dialog open={!!selectedImage} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl pt-0">
        <div className="w-full flex justify-between items-center pt-3 pb-2 border-b">
          <button
            onClick={() => onDownload(selectedImage)}
            className="text-gray-600 hover:text-gray-900 transition"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition w-5 h-5 flex items-center justify-center"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full h-[80vh] flex items-center justify-center bg-gray-50">
          <div className="flex items-center justify-center w-full h-full">
            {selectedImage.endsWith('.svg') ? (
              <object
                data={selectedImage}
                type="image/svg+xml"
                className="max-w-full max-h-full"
              />
            ) : selectedImage.endsWith('.pdf') ? (
              <embed
                src={`${selectedImage}#toolbar=0&navpanes=0&scrollbar=0`}
                type="application/pdf"
                className="w-full h-[80vh]"
              />
            ) : ['doc', 'docx', 'xls', 'xlsx'].some(ext => selectedImage.endsWith(`.${ext}`)) ? (
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedImage)}`}
                className="w-full h-[80vh]"
              />
            ) : (
              <img
                src={selectedImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                onError={(e) => (e.currentTarget.src = "fallback-image.png")}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewDialog;
