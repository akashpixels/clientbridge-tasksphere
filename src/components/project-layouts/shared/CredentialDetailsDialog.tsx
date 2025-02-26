
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";
import { Lock, Key, Globe, User } from "lucide-react";

interface CredentialDetailsDialogProps {
  credential: Tables<"project_credentials"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CredentialDetailsDialog = ({ credential, open, onOpenChange }: CredentialDetailsDialogProps) => {
  if (!credential) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {credential.type} Credentials
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {credential.details && (
            <div>
              <h4 className="text-sm font-medium mb-1">Details</h4>
              <p className="text-sm text-muted-foreground">{credential.details}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <h4 className="text-sm font-medium">URL</h4>
                <a 
                  href={credential.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  {credential.url}
                </a>
              </div>
            </div>

            {credential.username && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <h4 className="text-sm font-medium">Username</h4>
                  <p className="text-sm">{credential.username}</p>
                </div>
              </div>
            )}

            {credential.password && (
              <div className="flex items-start gap-2">
                <Key className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <h4 className="text-sm font-medium">Password</h4>
                  <p className="text-sm font-mono bg-secondary p-1 rounded">
                    {credential.password}
                  </p>
                </div>
              </div>
            )}
          </div>

          {credential.encrypted && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
              <Lock className="h-4 w-4" />
              <span>This credential is stored encrypted</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CredentialDetailsDialog;
