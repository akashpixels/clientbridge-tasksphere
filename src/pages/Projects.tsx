import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Project = Database['public']['Tables']['projects']['Row'] & {
  client: {
    id: string;
    user_profiles: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
  status: {
    name: string;
    color_hex: string;
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
          *,
          client:clients(
            id,
            user_profiles!clients_id_fkey(
              first_name,
              last_name
            )
          ),
          status:task_statuses(name, color_hex)
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

  const renderProjectCard = (project: Project) => {
    const gradientStyle = {
      background: `linear-gradient(70deg, ${project.primary_color_hex || '#9b87f5'} 0%, ${project.secondary_color_hex || '#7E69AB'} 40%, #fcfcfc 70%)`,
    };

    return (
      <Card 
        key={project.id} 
        className="p-6 hover:shadow-md transition-shadow overflow-hidden relative flex flex-col"
        style={{ aspectRatio: '10/15', height: '420px' }}
      >
        <div className="absolute inset-0 opacity-10" style={gradientStyle} />
        <div className="relative z-10 flex flex-col h-full">
          {project.logo_url && (
            <div className="mb-4 flex justify-center">
              <img 
                src={project.logo_url} 
                alt={`${project.name} logo`}
                className="w-16 h-16 object-contain rounded-lg"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
              <p className="text-sm text-gray-500">
                {project.client?.user_profiles ? 
                  `${project.client.user_profiles.first_name} ${project.client.user_profiles.last_name}` 
                  : 'No Client'}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                getProjectStatus(project) === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {getProjectStatus(project)}
              </span>
              {project.status?.name && (
                <span 
                  className="inline-block px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: `${project.status.color_hex}15`,
                    color: project.status.color_hex
                  }}
                >
                  {project.status.name}
                </span>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-500 mt-auto">
            Due Date: {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'}
          </div>
        </div>
      </Card>
    );
  };

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