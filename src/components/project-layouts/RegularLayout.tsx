
import { Card } from "@/components/ui/card";
import BaseProjectLayout, { BaseProjectData, TabDefinition } from "./BaseProjectLayout";
import TeamTab from "./shared/TeamTab";
import CredentialsTab from "./shared/CredentialsTab";

const RegularLayout = (props: BaseProjectData) => {
  const { project } = props;
  
  // Define tabs for this layout
  const tabs: TabDefinition[] = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Brand Overview</h3>
              <p className="text-gray-500 mt-1">{project.details || 'No details provided'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Brand Colors</h4>
                <div className="flex gap-2 mt-1">
                  {project.primary_color_hex && (
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: project.primary_color_hex }}
                      title="Primary Color"
                    />
                  )}
                  {project.secondary_color_hex && (
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: project.secondary_color_hex }}
                      title="Secondary Color"
                    />
                  )}
                </div>
              </div>
              
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
            </div>
          </div>
        </Card>
      ),
      default: true
    },
    {
      id: "brand-assets",
      label: "Brand Assets",
      content: (
        <Card className="p-6">
          <p>Brand assets content coming soon...</p>
        </Card>
      )
    },
    {
      id: "guidelines",
      label: "Guidelines",
      content: (
        <Card className="p-6">
          <p>Brand guidelines content coming soon...</p>
        </Card>
      )
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
      content: (
        <Card className="p-6">
          <p>Files content coming soon...</p>
        </Card>
      )
    }
  ];

  return <BaseProjectLayout {...props} tabs={tabs} />;
};

export default RegularLayout;
