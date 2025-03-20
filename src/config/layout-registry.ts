
import { LayoutConfig } from "@/context/project-layout";
import TeamTab from "@/components/project-layouts/shared/TeamTab";
import CredentialsTab from "@/components/project-layouts/shared/CredentialsTab";
import FilesTab from "@/components/project-layouts/shared/FilesTab";
import OverviewTab from "@/components/project-layouts/tabs/OverviewTab";
import ProjectHeader from "@/components/project-layouts/shared/ProjectHeader";
import TasksTab from "@/components/project-layouts/tabs/TasksTab";

// Define the layout registry with all available layouts
const layoutRegistry: Record<string, LayoutConfig> = {
  RETAINER: {
    id: "RETAINER",
    headerComponent: ProjectHeader,
    tabs: [
      {
        id: "tasks",
        label: "Tasks",
        component: TasksTab,
        default: true
      },
      {
        id: "overview",
        label: "Overview",
        component: OverviewTab
      },
      {
        id: "team",
        label: "Team",
        component: TeamTab
      },
      {
        id: "credentials",
        label: "Credentials",
        component: CredentialsTab
      },
      {
        id: "files",
        label: "Files",
        component: FilesTab
      }
    ]
  },
  REGULAR: {
    id: "REGULAR",
    headerComponent: ProjectHeader,
    tabs: [
      {
        id: "overview",
        label: "Overview",
        component: OverviewTab,
        default: true
      },
      {
        id: "brand-assets",
        label: "Brand Assets",
        component: () => <div>Brand assets content coming soon...</div>
      },
      {
        id: "guidelines",
        label: "Guidelines",
        component: () => <div>Brand guidelines content coming soon...</div>
      },
      {
        id: "team",
        label: "Team",
        component: TeamTab
      },
      {
        id: "credentials",
        label: "Credentials",
        component: CredentialsTab
      },
      {
        id: "files",
        label: "Files",
        component: FilesTab
      }
    ]
  },
  FUSION: {
    id: "FUSION",
    headerComponent: ProjectHeader,
    tabs: [
      {
        id: "overview",
        label: "Overview",
        component: OverviewTab,
        default: true
      },
      {
        id: "tasks",
        label: "Tasks",
        component: TasksTab
      },
      {
        id: "api-docs",
        label: "API Docs",
        component: () => <div>API documentation coming soon...</div>
      },
      {
        id: "deployments",
        label: "Deployments",
        component: () => <div>Deployment history coming soon...</div>
      },
      {
        id: "team",
        label: "Team",
        component: TeamTab
      },
      {
        id: "credentials",
        label: "Credentials",
        component: CredentialsTab
      }
    ]
  }
};

export default layoutRegistry;
