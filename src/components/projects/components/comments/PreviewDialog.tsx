
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FilePreview from "@/components/project-layouts/maintenance/comments/FilePreview";

interface PreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    url: string;
    type: string;
    name: string;
  } | null;
}

const PreviewDialog = ({ isOpen, onClose, file }: PreviewDialogProps) => {
  if (!file) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <div className="py-4">
          <FilePreview file={file} />
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewDialog;
