
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tables } from "@/integrations/supabase/types";
import { ReactNode } from "react";
import { useLayout } from "@/context/layout";
import { TabActionButton } from "../shared/TabActionButton";

export interface BaseProjectData {
  project: Tables<"projects"> & {
    client_admin?: {
      id: string;
      business_name: string;
      user_profiles?: {
        first_name: string;
        last_name: string;
      } | null;
    } | null;
    status?: {
      name: string;
      color_hex: string | null;
    } | null;
    project_subscriptions?: {
      id?: string;
      subscription_status?: string;
      allocated_duration?: unknown;
      actual_duration?: unknown;
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
        {headerContent}
      </div>

      <Tabs 
        defaultValue={defaultTab} 
        className="w-full"
        onValueChange={(value) => setCurrentTab(value)}
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabActionButton />
        </div>

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
