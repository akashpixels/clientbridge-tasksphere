
import { Card } from "@/components/ui/card";
import BaseProjectLayout, { BaseProjectData, TabDefinition } from "./core/BaseProjectLayout";
import TeamTab from "./shared/TeamTab";
import CredentialsTab from "./shared/CredentialsTab";
import FilesTab from "./shared/FilesTab";

const FusionLayout = (props: BaseProjectData) => {
  const { project } = props;
  
  // Get the latest subscription
  const currentSubscription = project.project_subscriptions?.[0];
  
  // Define tabs for this layout
  const tabs: TabDefinition[] = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <Card className="p-6">
          <div>
            <h3 className="text-lg font-medium">Development Overview</h3>
            <p className="text-gray-500 mt-1">{project.details || 'No details provided'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="font-medium">Status</h4>
              <span 
                className="inline-block px-2 py-1 rounded-full text-xs mt-1"
                style={{
                  backgroundColor: `${project.status?.color_hex}15`,
                  color: project.status?.color_hex
                }}
              >
                {project.status?.name || 'Unknown'}
              </span>
            </div>
            
            <div>
              <h4 className="font-medium">Hours</h4>
              <p className="text-gray-500 mt-1">
                {currentSubscription ? 
                  `${currentSubscription.actual_duration || 0} / ${currentSubscription.allocated_duration} hours` 
                  : 'No subscription data'}
              </p>
            </div>
          </div>
        </Card>
      ),
      default: true
    },
    {
      id: "tasks",
      label: "Tasks",
      content: <Card className="p-6">Tasks content coming soon...</Card>
    },
    {
      id: "api-docs",
      label: "API Docs",
      content: <Card className="p-6">API documentation coming soon...</Card>
    },
    {
      id: "deployments",
      label: "Deployments",
      content: <Card className="p-6">Deployment history coming soon...</Card>
    },
    {
      id: "team",
      label: "Team",
      content: <TeamTab projectId={project.id} />
    },
    {
      id: "credentials",
      label: "Credentials",
      content: <CredentialsTab projectId={project.id} />
    },
    {
      id: "files",
      label: "Files",
      content: <FilesTab projectId={project.id} />
    }
  ];

  return <BaseProjectLayout {...props} tabs={tabs} />;
};

export default FusionLayout;
