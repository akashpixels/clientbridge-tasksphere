
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  url: string;
  type: string;
  name: string;
}

interface PreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: FilePreviewProps | null;
}

const FilePreview = ({ url, type, name }: FilePreviewProps) => {
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type.toLowerCase());
  const isPdf = type.toLowerCase() === 'pdf';
  const isOffice = ['doc', 'docx', 'xls', 'xlsx'].includes(type.toLowerCase());

  return (
    <div className="w-full h-[80vh] flex items-center justify-center bg-gray-50">
      {isImage ? (
        <img
          src={url}
          alt={name}
          className="max-w-full max-h-full object-contain"
          onError={(e) => (e.currentTarget.src = "fallback-image.png")}
        />
      ) : isPdf ? (
        <embed
          src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
          type="application/pdf"
          className="w-full h-[80vh]"
        />
      ) : isOffice ? (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
          className="w-full h-[80vh]"
        />
      ) : (
        <div className="p-4 text-center">
          <p>File cannot be previewed. <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Download instead</a></p>
        </div>
      )}
    </div>
  );
};

const PreviewDialog = ({ isOpen, onClose, file }: PreviewDialogProps) => {
  if (!file) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <div className="py-4">
          <FilePreview url={file.url} type={file.type} name={file.name} />
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewDialog;
