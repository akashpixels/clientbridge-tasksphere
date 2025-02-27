
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContext, useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import ProjectHeader from "./maintenance/ProjectHeader";
import TasksTabContent from "./maintenance/TasksTabContent";
import ProjectStats from "./maintenance/ProjectStats";
import CredentialsTab from "./shared/CredentialsTab";
import TeamTab from "./shared/TeamTab";

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
  // Get subscription if available
  const subscription = project.project_subscriptions && project.project_subscriptions.length > 0 
    ? project.project_subscriptions[0] 
    : null;

  return (
    <div className="container mx-auto">
      <ProjectHeader project={project} />
      <ProjectStats 
        project={project} 
        subscription={subscription} 
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
          <TasksTabContent projectId={project.id} />
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
