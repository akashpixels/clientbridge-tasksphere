
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tables } from "@/integrations/supabase/types";
import { ReactNode } from "react";
import { useLayout } from "@/context/layout";

export interface BaseProjectData {
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
    project_subscriptions?: {
      id?: string;
      subscription_status?: string;
      allocated_duration: unknown;
      actual_duration: unknown;
      next_renewal_date?: string;
    }[];
  };
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  hoursUsageProgress?: ReactNode;
}

export interface TabDefinition {
  id: string;
  label: string;
  content: ReactNode;
  default?: boolean;
}

interface BaseProjectLayoutProps extends BaseProjectData {
  tabs: TabDefinition[];
  headerContent?: ReactNode;
  rightSidebar?: ReactNode;
}

const BaseProjectLayout = ({ 
  project, 
  tabs,
  headerContent,
  rightSidebar
}: BaseProjectLayoutProps) => {
  const { setCurrentTab } = useLayout();
  const defaultTab = tabs.find(tab => tab.default)?.id || tabs[0]?.id;

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        {headerContent || (
          <div className="flex items-center gap-4">
            {project.logo_url && (
              <img 
                src={project.logo_url} 
                alt={`${project.name} logo`}
                className="w-16 h-16 object-contain rounded-lg"
              />
            )}
            <div>
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <p className="text-gray-500">
                {project.client_admin?.user_profiles ? 
                  `${project.client_admin.user_profiles.first_name} ${project.client_admin.user_profiles.last_name}` 
                  : project.client_admin?.business_name || 'No Client'}
              </p>
            </div>
          </div>
        )}
      </div>

      <Tabs 
        defaultValue={defaultTab} 
        className="w-full"
        onValueChange={(value) => setCurrentTab(value)}
      >
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default BaseProjectLayout;
