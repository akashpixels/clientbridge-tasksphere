
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define types for our layout components and tabs
export interface TabConfig {
  id: string;
  label: string;
  component: React.ComponentType<any>;
  default?: boolean;
}

export interface LayoutConfig {
  id: string;
  headerComponent: React.ComponentType<any>;
  tabs: TabConfig[];
}

// Context type definition
interface ProjectLayoutContextType {
  currentLayout: string | null;
  setCurrentLayout: (layout: string) => void;
  currentTab: string | null;
  setCurrentTab: (tab: string) => void;
}

// Create context with default values
const ProjectLayoutContext = createContext<ProjectLayoutContextType>({
  currentLayout: null,
  setCurrentLayout: () => {},
  currentTab: null,
  setCurrentTab: () => {},
});

// Provider component
export const ProjectLayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLayout, setCurrentLayout] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string | null>(null);

  return (
    <ProjectLayoutContext.Provider
      value={{
        currentLayout,
        setCurrentLayout,
        currentTab,
        setCurrentTab,
      }}
    >
      {children}
    </ProjectLayoutContext.Provider>
  );
};

// Custom hook for using the context
export const useProjectLayout = () => useContext(ProjectLayoutContext);
