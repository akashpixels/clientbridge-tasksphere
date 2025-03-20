import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface LayoutContextType {
  rightSidebarContent: ReactNode | null;
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

  const closeRightSidebar = useCallback(() => {
    console.log('Closing right sidebar');
    setRightSidebarContent(null);
  }, []);

  // Effect to close right sidebar on route change
  useEffect(() => {
    closeRightSidebar();
  }, [location.pathname, closeRightSidebar]);

  // Effect to close right sidebar on tab change
  useEffect(() => {
    console.log('Tab changed to:', currentTab);
    closeRightSidebar();
  }, [currentTab, closeRightSidebar]);

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
