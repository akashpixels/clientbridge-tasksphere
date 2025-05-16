
import { createContext, useContext, ReactNode, useState, useCallback } from 'react';

interface LayoutContextType {
  rightSidebarContent: ReactNode | null;
  setRightSidebarContent: (content: ReactNode) => void;
  closeRightSidebar: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

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

  const closeRightSidebar = useCallback(() => {
    console.log('Closing right sidebar');
    setRightSidebarContent(null);
  }, []);

  // Effect to close right sidebar on tab change has been kept
  // but route change effect has been moved to MainContentArea
  console.log('LayoutProvider rendering');

  return (
    <LayoutContext.Provider 
      value={{ 
        rightSidebarContent,
        setRightSidebarContent,
        closeRightSidebar,
        currentTab,
        setCurrentTab
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}
