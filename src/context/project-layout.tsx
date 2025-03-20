
import { createContext, useContext, ReactNode, useState } from 'react';
import { Tables } from "@/integrations/supabase/types";
import layoutRegistry from '@/config/layout-registry';

// Define types for tab configuration
export interface TabConfig {
  id: string;
  label: string;
  component: React.ComponentType<TabComponentProps>;
  default?: boolean;
}

// Define types for layout configuration
export interface LayoutConfig {
  id: string;
  tabs: TabConfig[];
  headerComponent: React.ComponentType<ProjectHeaderProps>;
}

// Standard props for tab components
export interface TabComponentProps {
  projectId: string;
  selectedMonth?: string;
}

// Standard props for header components
export interface ProjectHeaderProps {
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
}

// Context for project layout state
export interface ProjectLayoutContextType {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  layoutRegistry: Record<string, LayoutConfig>;
}

const ProjectLayoutContext = createContext<ProjectLayoutContextType | undefined>(undefined);

export function useProjectLayout() {
  const context = useContext(ProjectLayoutContext);
  if (!context) {
    throw new Error('useProjectLayout must be used within a ProjectLayoutProvider');
  }
  return context;
}

interface ProjectLayoutProviderProps {
  children: ReactNode;
}

export function ProjectLayoutProvider({ children }: ProjectLayoutProviderProps) {
  const [activeTab, setActiveTab] = useState<string>('tasks');
  
  return (
    <ProjectLayoutContext.Provider 
      value={{ 
        activeTab,
        setActiveTab,
        layoutRegistry
      }}
    >
      {children}
    </ProjectLayoutContext.Provider>
  );
}
