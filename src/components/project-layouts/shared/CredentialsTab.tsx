
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Key, Globe, User } from "lucide-react";
import CredentialDetailsDialog from "./CredentialDetailsDialog";
import { Tables } from "@/integrations/supabase/types";

interface CredentialsTabProps {
  projectId: string;
}

const CredentialsTab = ({ projectId }: CredentialsTabProps) => {
  const [selectedCredential, setSelectedCredential] = useState<Tables<"project_credentials"> | null>(null);

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
    <>
      <Card className="p-6">
        {isLoadingCredentials ? (
          <div>Loading credentials...</div>
        ) : credentials && credentials.length > 0 ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <h3 className="text-lg font-medium">Project Credentials</h3>
              </div>
              <Button size="sm">
                Add Credentials
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {credentials.map((cred) => (
                <Card
                  key={cred.id}
                  className="p-4 flex flex-col h-[280px] hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-blue-500" />
                      <h4 className="font-medium truncate">{cred.type}</h4>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex-grow space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {cred.details || 'No additional details'}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-grow min-w-0">
                          <span className="text-xs text-muted-foreground block">URL</span>
                          <a 
                            href={cred.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:text-blue-600 truncate block"
                          >
                            {cred.url}
                          </a>
                        </div>
                      </div>
                      
                      {cred.username && (
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 mt-1 text-muted-foreground" />
                          <div className="flex-grow min-w-0">
                            <span className="text-xs text-muted-foreground block">Username</span>
                            <span className="text-sm truncate block">{cred.username}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-blue-500 hover:text-blue-600"
                      onClick={() => setSelectedCredential(cred)}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
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

      <CredentialDetailsDialog
        credential={selectedCredential}
        open={!!selectedCredential}
        onOpenChange={(open) => !open && setSelectedCredential(null)}
      />
    </>
  );
};

export default CredentialsTab;
