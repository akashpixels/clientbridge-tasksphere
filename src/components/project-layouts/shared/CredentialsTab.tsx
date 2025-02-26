
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Globe, User, Copy, Shield } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

interface CredentialsTabProps {
  projectId: string;
}

const CredentialCard = ({ credential }: { credential: Tables<"project_credentials"> }) => {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="relative flex flex-col h-[320px] hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      <div className="absolute top-2 right-2">
        <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Encrypted
        </span>
      </div>

      <div className="p-4 flex-grow space-y-4">
        <div>
          <h4 className="font-medium text-lg">{credential.type}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {credential.details || 'No additional details'}
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Globe className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <span className="text-xs text-muted-foreground block">URL</span>
              <a 
                href={credential.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-600 truncate block"
              >
                {credential.url}
              </a>
            </div>
          </div>
          
          {credential.username && (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-grow">
                <span className="text-xs text-muted-foreground block">Username</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono bg-secondary/50 px-2 py-1 rounded flex-grow truncate">
                    {credential.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(credential.username)}
                  >
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {credential.password && (
            <div className="flex items-start gap-2">
              <Eye className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-grow">
                <span className="text-xs text-muted-foreground block">Password</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono bg-secondary/50 px-2 py-1 rounded flex-grow truncate">
                    {showPassword ? credential.password : '••••••••'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(credential.password)}
                  >
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const CredentialsTab = ({ projectId }: CredentialsTabProps) => {
  const { data: credentials, isLoading: isLoadingCredentials } = useQuery({
    queryKey: ['credentials', projectId],
    queryFn: async () => {
      console.log('Fetching credentials for project:', projectId);
      const { data, error } = await supabase
        .from('project_credentials')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching credentials:', error);
        throw error;
      }

      console.log('Fetched credentials:', data);
      return data;
    },
  });

  return (
    <Card className="p-6">
      {isLoadingCredentials ? (
        <div>Loading credentials...</div>
      ) : credentials && credentials.length > 0 ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Project Credentials</h3>
            <Button size="sm">
              Add Credentials
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {credentials.map((cred) => (
              <CredentialCard key={cred.id} credential={cred} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No credentials found for this project.</p>
          <Button className="mt-4">
            Add First Credentials
          </Button>
        </div>
      )}
    </Card>
  );
};

export default CredentialsTab;
