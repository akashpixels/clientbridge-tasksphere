
import { cn } from '@/lib/utils';
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MainContentArea from './MainContentArea';

type LayoutContext = {
  setRightSidebarContent: (content: ReactNode) => void;
  closeRightSidebar: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
};

const LayoutContext = createContext<LayoutContext | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a Layout component');
  }
  return context;
};

const Layout = () => {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [rightSidebarContent, setRightSidebarContent] = useState<ReactNode | null>(null);
  const [currentTab, setCurrentTab] = useState('tasks');
  const location = useLocation();

  const setRightSidebar = (content: ReactNode) => {
    setRightSidebarContent(content);
    if (content) {
      setIsLeftSidebarOpen(false); // Collapse left sidebar when right sidebar is opened
    }
  };

  const closeRightSidebar = () => {
    setRightSidebarContent(null);
    setIsLeftSidebarOpen(true); // Restore left sidebar when right sidebar is closed
  };

  // Effect to close right sidebar on route change
  useEffect(() => {
    closeRightSidebar();
  }, [location.pathname]);

  // Effect to close right sidebar on tab change
  useEffect(() => {
    closeRightSidebar();
  }, [currentTab]);

  const context: LayoutContext = {
    setRightSidebarContent: setRightSidebar,
    closeRightSidebar,
    currentTab,
    setCurrentTab,
  };

  return (
    <LayoutContext.Provider value={context}>
      <div className="min-h-screen bg-[#f8f8f8]">
        <div className="flex">
          <LeftSidebar 
            isOpen={isLeftSidebarOpen} 
            onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} 
          />
          
          <MainContentArea isLeftSidebarOpen={isLeftSidebarOpen} />

          <RightSidebar content={rightSidebarContent} />
        </div>
      </div>
    </LayoutContext.Provider>
  );
};

export default Layout;
