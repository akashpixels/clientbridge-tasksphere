
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import ProjectHeader from "./ProjectHeader";
import TasksTabContent from "./TasksTabContent";
import CredentialsTab from "../shared/CredentialsTab";
import FilesTab from "../shared/FilesTab";
import TeamTab from "../shared/TeamTab";

interface MaintenanceLayoutProps {
  project: Tables<"projects"> & {
    client_admin: {
      id: string;
      business_name: string;
      user_profiles: {
        first_name: string;
        last_name: string;
      } | null;
    } | null;
    project_subscriptions: {
      subscription_status: string;
      hours_allotted: number;
      hours_spent: number | null;
      next_renewal_date: string;
      max_concurrent_tasks: number;
    }[];
  };
}

const MaintenanceLayout = ({ project }: MaintenanceLayoutProps) => {
  const [selectedTab, setSelectedTab] = useState("tasks");
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    format(currentDate, "yyyy-MM")
  );

  // Get the first subscription or use default values if none exists
  const subscription = project.project_subscriptions && project.project_subscriptions.length > 0 
    ? project.project_subscriptions[0] 
    : { hours_allotted: 0, hours_spent: 0, max_concurrent_tasks: 1 };

  console.log("Project subscription data:", subscription);
  
  // This should be calculated based on the selected month, for now we'll use subscription data
  const monthlyHours = subscription.hours_allotted || 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <ProjectHeader 
        project={project} 
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        monthlyHours={monthlyHours}
      />
      
      <div className="mt-8">
        <Tabs 
          defaultValue="tasks" 
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="mb-8">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks">
            <TasksTabContent 
              project={project} 
              selectedMonth={selectedMonth} 
              maxConcurrentTasks={subscription.max_concurrent_tasks}
            />
          </TabsContent>
          
          <TabsContent value="credentials">
            <CredentialsTab projectId={project.id} />
          </TabsContent>
          
          <TabsContent value="files">
            <FilesTab projectId={project.id} />
          </TabsContent>
          
          <TabsContent value="team">
            <TeamTab projectId={project.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MaintenanceLayout;
