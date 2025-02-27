
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
  const { data: monthlyTasks } = useQuery({
    queryKey: ['monthly-tasks', project.id, selectedMonth],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('actual_hours_spent')
        .eq('project_id', project.id);
      return data || [];
    }
  });
  
  // Calculate monthly hours from tasks
  const monthlyHours = monthlyTasks?.reduce((sum, task) => sum + (task.actual_hours_spent || 0), 0) || 0;
  
  // Get subscription if available
  const subscription = project.project_subscriptions && project.project_subscriptions.length > 0 
    ? project.project_subscriptions[0] 
    : null;

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
            isLoadingTasks={false}
            tasks={[]}
            sortConfig={{ key: 'created_at', direction: 'desc' }}
            onSort={() => {}}
            onImageClick={() => {}}
            onCommentClick={() => {}}
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
