
import { ReactNode } from "react";
import { BaseProjectData } from "@/components/project-layouts/core/BaseProjectLayout";
import CredentialsTab from "@/components/project-layouts/shared/CredentialsTab";
import ProjectHeader from "@/components/project-layouts/shared/ProjectHeader";
import TeamTab from "@/components/project-layouts/shared/TeamTab";
import FilesTab from "@/components/project-layouts/shared/FilesTab";
import OverviewTab from "@/components/project-layouts/tabs/OverviewTab";
import TasksTab from "@/components/project-layouts/tabs/TasksTab";

export type LayoutType = "RETAINER" | "REGULAR" | "FUSION" | "MAINTENANCE";

export interface TabDefinition {
  id: string;
  label: string;
  content: ReactNode;
  default?: boolean;
}

export interface LayoutConfig {
  header: (props: BaseProjectData) => ReactNode;
  getTabs: (props: BaseProjectData) => TabDefinition[];
}

// Layout registry containing all available layout configurations
const layoutRegistry: Record<LayoutType, LayoutConfig> = {
  RETAINER: {
    header: (props: BaseProjectData) => (
      <ProjectHeader 
        project={props.project}
        hoursUsageProgress={props.hoursUsageProgress}
        selectedMonth={props.selectedMonth}
        onMonthChange={props.onMonthChange}
      />
    ),
    getTabs: (props: BaseProjectData) => [
      {
        id: "tasks",
        label: "Tasks",
        content: <TasksTab projectId={props.project.id} />,
        default: true
      },
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab project={props.project} />
      },
      {
        id: "team",
        label: "Team",
        content: <TeamTab projectId={props.project.id} />
      },
      {
        id: "credentials",
        label: "Credentials",
        content: <CredentialsTab projectId={props.project.id} />
      },
      {
        id: "files",
        label: "Files",
        content: <FilesTab projectId={props.project.id} />
      }
    ]
  },
  REGULAR: {
    header: (props: BaseProjectData) => (
      <ProjectHeader 
        project={props.project}
      />
    ),
    getTabs: (props: BaseProjectData) => [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab project={props.project} />,
        default: true
      },
      {
        id: "tasks",
        label: "Tasks",
        content: <TasksTab projectId={props.project.id} />
      },
      {
        id: "team",
        label: "Team",
        content: <TeamTab projectId={props.project.id} />
      },
      {
        id: "credentials",
        label: "Credentials",
        content: <CredentialsTab projectId={props.project.id} />
      },
      {
        id: "files",
        label: "Files",
        content: <FilesTab projectId={props.project.id} />
      }
    ]
  },
  FUSION: {
    header: (props: BaseProjectData) => (
      <ProjectHeader 
        project={props.project}
      />
    ),
    getTabs: (props: BaseProjectData) => [
      {
        id: "tasks",
        label: "Tasks",
        content: <TasksTab projectId={props.project.id} />,
        default: true
      },
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab project={props.project} />
      },
      {
        id: "team",
        label: "Team",
        content: <TeamTab projectId={props.project.id} />
      },
      {
        id: "credentials",
        label: "Credentials",
        content: <CredentialsTab projectId={props.project.id} />
      },
      {
        id: "files",
        label: "Files",
        content: <FilesTab projectId={props.project.id} />
      }
    ]
  },
  MAINTENANCE: {
    header: (props: BaseProjectData) => (
      <ProjectHeader 
        project={props.project}
        hoursUsageProgress={props.hoursUsageProgress}
        selectedMonth={props.selectedMonth}
        onMonthChange={props.onMonthChange}
      />
    ),
    getTabs: (props: BaseProjectData) => [
      {
        id: "tasks",
        label: "Tasks",
        content: <TasksTab projectId={props.project.id} />,
        default: true
      },
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab project={props.project} />
      },
      {
        id: "team",
        label: "Team",
        content: <TeamTab projectId={props.project.id} />
      },
      {
        id: "credentials",
        label: "Credentials",
        content: <CredentialsTab projectId={props.project.id} />
      },
      {
        id: "files",
        label: "Files",
        content: <FilesTab projectId={props.project.id} />
      }
    ]
  }
};

export default layoutRegistry;
