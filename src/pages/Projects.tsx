import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useState } from "react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");

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

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status?.name === statusFilter;
    const matchesSubscription = subscriptionFilter === "all" || project.subscription_status === subscriptionFilter;
    return matchesSearch && matchesStatus && matchesSubscription;
  });

  const renderProjectCard = (project: Project) => {
    const gradientStyle = {
      background: `linear-gradient(70deg, ${project.primary_color_hex || '#9b87f5'} 0%, ${project.secondary_color_hex || '#7E69AB'} 40%, #fcfcfc 70%)`,
      transformOrigin: 'bottom right',
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
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                project.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {project.subscription_status === 'active' ? 'Active' : 'Inactive'}
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

          <div className="mt-auto space-y-2">
            <p className="text-sm text-gray-500">
              {project.client?.user_profiles ? 
                `${project.client.user_profiles.first_name} ${project.client.user_profiles.last_name}` 
                : 'No Client'}
            </p>
            <div className="text-sm text-gray-500">
              Due Date: {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'}
            </div>
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

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Review">Review</SelectItem>
            <SelectItem value="Feedback">Feedback</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
            <SelectItem value="Blocked">Blocked</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by subscription" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading projects...</div>
      ) : filteredProjects?.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No projects found.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects?.map(renderProjectCard)}
        </div>
      )}
    </div>
  );
};

export default Projects;