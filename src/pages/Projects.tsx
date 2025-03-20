
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { ProjectList } from "@/components/projects/ProjectList";

type Project = {
  id: string;
  name: string;
  logo_url: string;
  due_date: string | null;
  layout_type: string; // Updated from layout_id
  client_admin: {
    id: string;
    business_name: string;
    user_profiles: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
  status: {
    name: string;
    color_hex: string;
  } | null;
  project_subscriptions?: {
    subscription_status: string;
  }[];
};

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

const Projects = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('Fetching projects...');
      // Updated query to use layout_type instead of layout:project_layouts
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client_admin:client_admins(
            id,
            business_name,
            user_profiles(
              first_name,
              last_name
            )
          ),
          status:task_statuses(name, color_hex),
          project_subscriptions(subscription_status)
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
    const matchesSubscription = subscriptionFilter === "all" || project.project_subscriptions?.[0]?.subscription_status === subscriptionFilter;
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
        aValue = a.client_admin?.user_profiles ? 
          `${a.client_admin.user_profiles.first_name} ${a.client_admin.user_profiles.last_name}` : 
          a.client_admin?.business_name || '';
        bValue = b.client_admin?.user_profiles ? 
          `${b.client_admin.user_profiles.first_name} ${b.client_admin.user_profiles.last_name}` : 
          b.client_admin?.business_name || '';
        break;
      case 'status':
        aValue = a.status?.name || '';
        bValue = b.status?.name || '';
        break;
      case 'subscription':
        aValue = a.project_subscriptions?.[0]?.subscription_status || '';
        bValue = b.project_subscriptions?.[0]?.subscription_status || '';
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
        />

        {isLoading ? (
          <div className="text-center py-8">Loading projects...</div>
        ) : filteredProjects?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No projects found.</div>
        ) : (
          <ProjectList projects={sortedProjects} onSort={handleSort} />
        )}
      </div>
    </div>
  );
};

export default Projects;
