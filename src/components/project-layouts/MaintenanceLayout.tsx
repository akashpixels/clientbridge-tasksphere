
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContext, useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import ProjectHeader from "./maintenance/ProjectHeader";
import TasksTabContent from "./maintenance/TasksTabContent";
import ProjectStats from "./maintenance/ProjectStats";
import CredentialsTab from "./shared/CredentialsTab";
import TeamTab from "./shared/TeamTab";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MaintenanceLayoutProps {
  project: Tables<"projects"> & {
    client: {
      id: string;
      user_profiles: {
        first_name: string;
        last_name: string;
      } | null;
    } | null;
    status: {
      name: string;
      color_hex: string | null;
    } | null;
    project_subscriptions: Array<{
      subscription_status: string;
      hours_allotted: number;
      hours_spent: number | null;
      next_renewal_date: string;
    }>;
  };
}

const MaintenanceLayout = ({ project }: MaintenanceLayoutProps) => {
  // State for month selection
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  // Get tasks for the current month to calculate hours
  const { data: monthlyTasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['monthly-tasks', project.id, selectedMonth],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select(`
          *,
          task_type:task_types(name, category),
          status:task_statuses!tasks_current_status_id_fkey(name, color_hex),
          priority:priority_levels(name, color),
          complexity:complexity_levels(name, multiplier),
          assigned_user:user_profiles!tasks_assigned_user_id_fkey(first_name, last_name)
        `)
        .eq('project_id', project.id);
      return data || [];
    }
  });
  
  // Calculate monthly hours from tasks
  const monthlyHours = monthlyTasks?.reduce((sum, task) => sum + (task.actual_hours_spent || 0), 0) || 0;
  
  // Sorting state for tasks
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' as 'asc' | 'desc' });
  
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const handleImageClick = (image: string, images: string[]) => {
    // Handle image click (left empty for now)
    console.log("Image clicked:", image);
  };
  
  const handleCommentClick = (taskId: string) => {
    // Handle comment click (left empty for now)
    console.log("Comment clicked for task:", taskId);
  };

  return (
    <div className="container mx-auto">
      <ProjectHeader 
        project={project} 
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        monthlyHours={monthlyHours}
      />
      <ProjectStats 
        project={project} 
        selectedMonth={selectedMonth}
        monthlyHours={monthlyHours}
      />

      <Tabs defaultValue="tasks" className="w-full mt-6">
        <TabsList className="w-full max-w-screen-lg border-b">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <TasksTabContent 
            isLoadingTasks={isLoadingTasks}
            tasks={monthlyTasks || []}
            sortConfig={sortConfig}
            onSort={handleSort}
            onImageClick={handleImageClick}
            onCommentClick={handleCommentClick}
          />
        </TabsContent>

        <TabsContent value="overview">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-4">Project Details</h3>
            <p className="text-gray-600">{project.details || 'No details provided'}</p>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <TeamTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="credentials">
          <CredentialsTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="files">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <p>Files content coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaintenanceLayout;
