
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Test2 = () => {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Fetch projects for the dropdown
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['test2-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
        
      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error loading projects",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    }
  });
  
  // Fetch project data when a project is selected
  const { data: projectData, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ['test2-project-data', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      
      // Get subscription details - using maybeSingle() instead of single()
      const { data: subscriptionDetails, error: subscriptionError } = await supabase
        .from('project_subscriptions')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Error fetching subscription details:', subscriptionError);
        toast({
          title: "Error loading subscription details",
          description: subscriptionError.message,
          variant: "destructive",
        });
        throw subscriptionError;
      }
      
      // Get basic project data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          status:task_statuses(name, color_hex)
        `)
        .eq('id', selectedProjectId)
        .single();
        
      if (projectError) {
        console.error('Error fetching project:', projectError);
        toast({
          title: "Error loading project",
          description: projectError.message,
          variant: "destructive",
        });
        throw projectError;
      }
      
      // Create default subscription data if none exists
      const defaultSubscription = {
        subscription_status: "unknown",
        billing_cycle: null,
        start_date: null,
        next_renewal_date: null,
        auto_renew: false
      };
      
      return {
        project,
        subscription: subscriptionDetails || defaultSubscription
      };
    },
    enabled: !!selectedProjectId,
  });
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test2 - Project Data</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select a Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-select">Project</Label>
              <Select
                value={selectedProjectId || ""}
                onValueChange={(value) => setSelectedProjectId(value)}
              >
                <SelectTrigger id="project-select" className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading projects...
                    </SelectItem>
                  ) : (
                    projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {projectError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Error loading project data. Please try again later.
          </AlertDescription>
        </Alert>
      )}
      
      {projectLoading && selectedProjectId && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center">
              <p>Loading project details...</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedProjectId && projectData && (
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <p className="text-gray-700">{projectData.project.name}</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center">
                    <span 
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: projectData.project.status?.color_hex || '#888' }}
                    />
                    <p className="text-gray-700">{projectData.project.status?.name || 'Unknown'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Subscription Details</h3>
                
                <div className="space-y-2">
                  <Label>Subscription Status</Label>
                  <p className="text-gray-700 capitalize">{projectData.subscription.subscription_status}</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <p className="text-gray-700 capitalize">{projectData.subscription.billing_cycle || 'Not set'}</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <p className="text-gray-700">
                    {projectData.subscription.start_date ? 
                      new Date(projectData.subscription.start_date).toLocaleDateString() : 
                      'Not set'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Next Renewal Date</Label>
                  <p className="text-gray-700">
                    {projectData.subscription.next_renewal_date ? 
                      new Date(projectData.subscription.next_renewal_date).toLocaleDateString() : 
                      'Not set'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Auto Renew</Label>
                  <p className="text-gray-700">{projectData.subscription.auto_renew ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Test2;
