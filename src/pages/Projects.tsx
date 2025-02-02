import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Project = Database['public']['Tables']['projects']['Row'] & {
  client: {
    business_name: string;
  } | null;
};

const Projects = () => {
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('Fetching projects...');
      const { data, error } = await supabase
        .from('projects')
        .select(`
          name,
          due_date,
          subscription_status,
          client:clients(business_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }
      
      console.log('Projects fetched:', data);
      return data as Project[];
    },
  });

  const getProjectStatus = (project: Project) => {
    if (!project.subscription_status || project.subscription_status === 'inactive') return 'Inactive';
    return 'Active';
  };

  const renderProjectCard = (project: Project) => (
    <Card key={project.id} className="p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
          <p className="text-sm text-gray-500">{project.client?.business_name || 'No Client'}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${
          getProjectStatus(project) === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {getProjectStatus(project)}
        </span>
      </div>

      <div className="text-sm text-gray-500">
        Due Date: {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'}
      </div>
    </Card>
  );

  if (error) {
    console.error('Error in projects component:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-500">Error loading projects. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Projects</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Projects</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : projects?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No active projects found.</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects
                ?.filter(p => getProjectStatus(p) === 'Active')
                .map(renderProjectCard)}
            </div>
          )}
        </TabsContent>
        <TabsContent value="inactive" className="mt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : projects?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No inactive projects found.</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects
                ?.filter(p => getProjectStatus(p) === 'Inactive')
                .map(renderProjectCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Projects;