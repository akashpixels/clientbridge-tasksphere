import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { ProjectList } from "@/components/projects/ProjectList";

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

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

const Projects = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

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

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedProjects = [...(filteredProjects || [])].sort((a, b) => {
    if (!sortConfig) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortConfig.key) {
      case 'client':
        aValue = a.client?.user_profiles ? `${a.client.user_profiles.first_name} ${a.client.user_profiles.last_name}` : '';
        bValue = b.client?.user_profiles ? `${b.client.user_profiles.first_name} ${b.client.user_profiles.last_name}` : '';
        break;
      case 'status':
        aValue = a.status?.name || '';
        bValue = b.status?.name || '';
        break;
      case 'subscription':
        aValue = a.subscription_status;
        bValue = b.subscription_status;
        break;
      case 'dueDate':
        aValue = a.due_date || '';
        bValue = b.due_date || '';
        break;
      default:
        return 0;
    }

    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

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
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Projects</h1>
        </div>

        <ProjectFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          subscriptionFilter={subscriptionFilter}
          setSubscriptionFilter={setSubscriptionFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {isLoading ? (
          <div className="text-center py-8">Loading projects...</div>
        ) : filteredProjects?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No projects found.</div>
        ) : viewMode === "grid" ? (
          <ProjectGrid projects={sortedProjects} />
        ) : (
          <ProjectList projects={sortedProjects} onSort={handleSort} />
        )}
      </div>
    </div>
  );
};

export default Projects;