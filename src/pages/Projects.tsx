import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, List, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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

  const renderProjectCard = (project: Project) => {
    const gradientStyle = {
      background: `linear-gradient(135deg, ${project.primary_color_hex || '#9b87f5'} 0%, ${project.secondary_color_hex || '#7E69AB'} 40%, #fcfcfc 70%)`,
      transformOrigin: 'bottom right',
    };

    return (
      <Link to={`/projects/${project.id}`} key={project.id}>
        <Card 
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
      </Link>
    );
  };

  const renderProjectList = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('client')}
                className="h-8 flex items-center gap-1"
              >
                Client
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('status')}
                className="h-8 flex items-center gap-1"
              >
                Status
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('subscription')}
                className="h-8 flex items-center gap-1"
              >
                Subscription
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('dueDate')}
                className="h-8 flex items-center gap-1"
              >
                Due Date
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProjects?.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  {project.logo_url && (
                    <img 
                      src={project.logo_url} 
                      alt={`${project.name} logo`}
                      className="w-8 h-8 object-contain rounded"
                    />
                  )}
                  {project.name}
                </div>
              </TableCell>
              <TableCell>
                {project.client?.user_profiles ? 
                  `${project.client.user_profiles.first_name} ${project.client.user_profiles.last_name}` 
                  : 'No Client'}
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                  project.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.subscription_status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell>
                {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Projects</h1>
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
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
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filter by subscription" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "grid" | "list")}>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading projects...</div>
        ) : filteredProjects?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No projects found.</div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects?.map(renderProjectCard)}
          </div>
        ) : (
          renderProjectList()
        )}
      </div>
    </div>
  );
};

export default Projects;
