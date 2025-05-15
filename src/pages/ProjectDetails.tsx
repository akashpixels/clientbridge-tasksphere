
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useProjectData } from "@/hooks/useProjectData";
import { Tables } from "@/integrations/supabase/types";
import BaseProjectLayout, { TabDefinition } from "@/components/projects/core/BaseProjectLayout";
import ProjectHeader from "@/components/projects/shared/ProjectHeader";
import OverviewTab from "@/components/projects/tabs/OverviewTab";
import TasksTab from "@/components/projects/tabs/TasksTab";
import TeamTab from "@/components/projects/shared/TeamTab";
import CredentialsTab from "@/components/projects/shared/CredentialsTab";
import FilesTab from "@/components/projects/shared/FilesTab";
import ProjectStats from "@/components/projects/components/ProjectStats";
import layoutRegistry from "@/config/layout-registry";
import { Card } from "@/components/ui/card";
import RetainerLayout from "@/components/projects/layouts/RetainerLayout";

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { project, isLoading, error, selectedMonth, setSelectedMonth } = useProjectData(id);

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading project details...</div>;
  }

  if (error || !project) {
    return <div className="container mx-auto p-6">Project not found</div>;
  }

  // Get layout type from project
  const layoutType = project.layout_type || "RETAINER";
  
  // For RETAINER layout type, we use the dedicated RetainerLayout component
  if (layoutType === "RETAINER") {
    return (
      <RetainerLayout
        project={project}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />
    );
  }
  
  // Generate tab definitions based on layout type
  const getTabs = () => {
    // Default tabs for all layouts
    const defaultTabs: TabDefinition[] = [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab projectId={project.id} />,
        default: true
      },
      {
        id: "team",
        label: "Team",
        content: <TeamTab projectId={project.id} />,
      },
      {
        id: "credentials",
        label: "Credentials",
        content: <CredentialsTab projectId={project.id} />,
      }
    ];

    // Add layout-specific tabs
    switch(layoutType) {
      case "REGULAR":
        return [
          ...defaultTabs,
          {
            id: "brand-assets",
            label: "Brand Assets",
            content: <Card className="p-6">Brand assets content coming soon...</Card>,
          },
          {
            id: "guidelines",
            label: "Guidelines",
            content: <Card className="p-6">Brand guidelines content coming soon...</Card>,
          },
          {
            id: "files",
            label: "Files",
            content: <FilesTab projectId={project.id} />,
          }
        ];
        
      case "FUSION":
        return [
          ...defaultTabs,
          {
            id: "tasks",
            label: "Tasks",
            content: <TasksTab projectId={project.id} selectedMonth={selectedMonth} />,
          },
          {
            id: "api-docs",
            label: "API Docs",
            content: <Card className="p-6">API documentation coming soon...</Card>,
          },
          {
            id: "deployments",
            label: "Deployments",
            content: <Card className="p-6">Deployment history coming soon...</Card>,
          }
        ];
        
      default:
        return defaultTabs;
    }
  };

  // Create header content with project stats for non-RETAINER layouts
  const headerContent = (
    <ProjectHeader
      project={project}
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
    />
  );

  return (
    <BaseProjectLayout
      project={project}
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      tabs={getTabs()}
      headerContent={headerContent}
    />
  );
};

export default ProjectDetails;
