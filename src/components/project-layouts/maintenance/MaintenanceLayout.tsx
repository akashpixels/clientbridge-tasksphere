import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import ProjectHeader from "./ProjectHeader";
import TaskList from "./TaskList";
import CredentialsTab from "../shared/CredentialsTab";
import TeamTab from "../shared/TeamTab";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ImageViewerDialog from "@/components/ImageViewerDialog";
import TaskCommentThread from "@/components/TaskCommentThread";

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
    status: {
      name: string;
      color_hex: string | null;
    } | null;
    project_subscriptions: {
      hours_allotted: number;
      subscription_status: string;
      next_renewal_date: string;
      hours_spent?: number;
    }[];
  };
}

const MaintenanceLayout = ({ project }: MaintenanceLayoutProps) => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Fetch tasks for the project
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['project-tasks', project.id, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_status(name, color_hex),
          assigned_to:user_profiles(id, first_name, last_name, avatar_url),
          task_comments(
            id,
            content,
            created_at,
            user_profiles(id, first_name, last_name, avatar_url)
          ),
          task_attachments(id, file_name, file_url, file_type, created_at)
        `)
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate monthly hours
  const { data: monthlyHours = 0 } = useQuery({
    queryKey: ['monthly-hours', project.id, selectedMonth],
    queryFn: async () => {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = month === '12' 
        ? `${parseInt(year) + 1}-01-01` 
        : `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`;
      
      const { data, error } = await supabase
        .from('time_entries')
        .select('hours')
        .eq('project_id', project.id)
        .gte('date', startDate)
        .lt('date', endDate);
      
      if (error) throw error;
      
      return data.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    }
  });

  return (
    <div className="container mx-auto p-6">
      <ProjectHeader 
        project={project} 
        selectedMonth={selectedMonth} 
        onMonthChange={setSelectedMonth}
        monthlyHours={monthlyHours}
      />
      
      <Tabs defaultValue="tasks" className="w-full mt-6">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card className="p-6">
            <TaskList 
              tasks={tasks || []} 
              isLoading={isLoading}
              onTaskSelect={setSelectedTask}
              onImageSelect={setSelectedImage}
            />
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card className="p-6">
            <p>Time tracking content coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <TeamTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="credentials">
          <CredentialsTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="files">
          <Card className="p-6">
            <p>Files content coming soon...</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Comment Thread Dialog */}
      <TaskCommentThread 
        open={!!selectedTask} 
        onOpenChange={(open) => !open && setSelectedTask(null)}
        taskId={selectedTask || ''}
      />

      {/* Image Viewer Dialog */}
      <ImageViewerDialog 
        open={!!selectedImage} 
        onOpenChange={(open) => !open && setSelectedImage(null)}
        imageUrl={selectedImage || ''}
      />
    </div>
  );
};

export default MaintenanceLayout;
