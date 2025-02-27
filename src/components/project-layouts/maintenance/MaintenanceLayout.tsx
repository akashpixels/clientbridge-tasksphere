
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import ProjectHeader from "./ProjectHeader";
import TasksTabContent from "./TasksTabContent";
import ProjectStats from "./ProjectStats";
import CredentialsTab from "../shared/CredentialsTab";
import TeamTab from "../shared/TeamTab";
import TaskCommentThread from "./comments/TaskCommentThread";
import ImageViewerDialog from "./ImageViewerDialog";
import FilesTab from "../shared/FilesTab";
import { format } from "date-fns";

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
  // State
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [allImages, setAllImages] = useState<string[]>([]);
  
  // Get monthly hours (dummy for now)
  const monthlyHours = 0;
  
  // Handle closing comment thread
  const handleCloseThread = () => {
    setSelectedTaskId(null);
  };
  
  // Handle opening image viewer
  const handleImageClick = (clickedImage: string, allTaskImages: string[]) => {
    setCurrentImage(clickedImage);
    setAllImages(allTaskImages);
    setIsViewerOpen(true);
  };
  
  // Handle opening comment thread
  const handleCommentClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };
  
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
            projectId={project.id} 
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
          <FilesTab projectId={project.id} />
        </TabsContent>
      </Tabs>
      
      {selectedTaskId && (
        <TaskCommentThread 
          taskId={selectedTaskId} 
          onClose={handleCloseThread} 
        />
      )}
      
      <ImageViewerDialog 
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        currentImage={currentImage}
        images={allImages}
      />
    </div>
  );
};

export default MaintenanceLayout;
