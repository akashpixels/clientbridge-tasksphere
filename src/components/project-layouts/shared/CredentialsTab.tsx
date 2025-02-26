
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface CredentialsTabProps {
  projectId: string;
}

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
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <h3 className="text-lg font-medium">Project Credentials</h3>
            </div>
            <Button size="sm">
              Add Credentials
            </Button>
          </div>
          <div className="grid gap-4">
            {credentials.map((cred) => (
              <div 
                key={cred.id} 
                className="p-4 border rounded-lg bg-card"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{cred.type}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cred.details || 'No additional details'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600">
                    View Details
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">URL:</span>
                    <a 
                      href={cred.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:text-blue-600"
                    >
                      {cred.url}
                    </a>
                  </div>
                  {cred.username && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Username:</span>
                      <span className="text-sm">{cred.username}</span>
                    </div>
                  )}
                  {cred.encrypted && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        🔒 Encrypted
                      </span>
                    </div>
                  )}
                </div>
              </div>
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
