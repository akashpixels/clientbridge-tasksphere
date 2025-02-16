
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface LayoutContextType {
  setRightSidebarContent: (content: ReactNode) => void;
  closeRightSidebar: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
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
  const location = useLocation();

  const closeRightSidebar = () => setRightSidebarContent(null);

  // Effect to close right sidebar on route change
  useEffect(() => {
    closeRightSidebar();
  }, [location.pathname]);

  // Effect to close right sidebar on tab change
  useEffect(() => {
    closeRightSidebar();
  }, [currentTab]);

  return (
    <LayoutContext.Provider 
      value={{ 
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
