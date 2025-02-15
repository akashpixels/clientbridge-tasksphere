
import { createContext, useContext, ReactNode, useState } from 'react';

interface LayoutContextType {
  setRightSidebarContent: (content: ReactNode) => void;
  closeRightSidebar: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  rightSidebarContent: ReactNode | null;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

interface LayoutProviderProps {
  children: ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [rightSidebarContent, setRightSidebarContent] = useState<ReactNode | null>(null);
  const [currentTab, setCurrentTab] = useState('tasks');

  const closeRightSidebar = () => setRightSidebarContent(null);

  return (
    <LayoutContext.Provider 
      value={{ 
        setRightSidebarContent,
        closeRightSidebar,
        currentTab,
        setCurrentTab,
        rightSidebarContent
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}
