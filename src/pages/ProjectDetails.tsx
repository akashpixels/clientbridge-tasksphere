import { useState } from "react";
import { useParams } from "react-router-dom";
import { useProjectData } from "@/hooks/useProjectData";
import { Tables } from "@/integrations/supabase/types";
import BaseProjectLayout, { TabDefinition } from "@/components/project-layouts/core/BaseProjectLayout";
import ProjectHeader from "@/components/project-layouts/shared/ProjectHeader";
import OverviewTab from "@/components/project-layouts/tabs/OverviewTab";
import TasksTab from "@/components/project-layouts/tabs/TasksTab";
import TeamTab from "@/components/project-layouts/shared/TeamTab";
import CredentialsTab from "@/components/project-layouts/shared/CredentialsTab";
import FilesTab from "@/components/project-layouts/shared/FilesTab";
import ProjectStats from "@/components/project-layouts/maintenance/ProjectStats";
import layoutRegistry from "@/config/layout-registry";
import { Card } from "@/components/ui/card";

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
  
  // Generate tab definitions based on layout type
  const getTabs = () => {
    // Default tabs for all layouts
    const defaultTabs: TabDefinition[] = [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab projectId={project.id} />,
        default: layoutType !== "RETAINER"
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
      case "RETAINER":
        return [
          {
            id: "tasks",
            label: "Tasks",
            content: <TasksTab projectId={project.id} selectedMonth={selectedMonth} />,
            default: true
          },
          ...defaultTabs,
          {
            id: "files",
            label: "Files",
            content: <FilesTab projectId={project.id} />,
          }
        ];
        
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

  // Create header content with project stats for RETAINER layout
  const headerContent = (
    <ProjectHeader
      project={project}
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      statsComponent={
        layoutType === "RETAINER" ? 
          <ProjectStats project={project} selectedMonth={selectedMonth} /> : 
          undefined
      }
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
