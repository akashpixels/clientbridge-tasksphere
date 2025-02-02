import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Users } from "lucide-react";

const Projects = () => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(business_name),
          assignees:project_assignees(
            user:user_profiles(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getProjectStatus = (project: any) => {
    if (!project.subscription_status || project.subscription_status === 'inactive') return 'Inactive';
    if (project.progress >= 100) return 'Completed';
    return 'Active';
  };

  const renderProjectCard = (project: any) => (
    <Card key={project.id} className="p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
          <p className="text-sm text-gray-500">{project.client?.business_name || 'No Client'}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${
          getProjectStatus(project) === 'Active' ? 'bg-green-100 text-green-800' :
          getProjectStatus(project) === 'Completed' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {getProjectStatus(project)}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Progress</span>
            <span>{project.progress || 0}%</span>
          </div>
          <Progress value={project.progress || 0} className="h-2" />
        </div>

        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <CalendarDays className="w-4 h-4" />
            <span>{new Date(project.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Users className="w-4 h-4" />
            <span>{project.assignees?.length || 0} members</span>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Projects</TabsTrigger>
          <TabsTrigger value="completed">Completed Projects</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects
                ?.filter(p => getProjectStatus(p) === 'Active')
                .map(renderProjectCard)}
            </div>
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects
                ?.filter(p => getProjectStatus(p) === 'Completed')
                .map(renderProjectCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Projects;