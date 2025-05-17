
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
}

const BaseProjectLayout = ({ 
  project, 
  tabs,
  headerContent
}: BaseProjectLayoutProps) => {
  const { setCurrentTab } = useLayout();
  const defaultTab = tabs.find(tab => tab.default)?.id || tabs[0]?.id;

  return (
    <div className="containerx mx-auto">
    

      <Tabs 
        defaultValue={defaultTab} 
        className="w-full"
        onValueChange={(value) => setCurrentTab(value)}
      >
        <div className="flex justify-between items-center mb-8 px-5 py-1 border-b-1">
          <TabsList>
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabActionButton />
        </div>
        
  <div className="mb-8">
        {headerContent}
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
