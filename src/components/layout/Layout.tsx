
import { cn } from '@/lib/utils';
import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MainContentArea from './MainContentArea';
import { useLayout as useLayoutContext } from '@/context/layout';

const Layout = () => {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const { closeRightSidebar, currentTab, setRightSidebarContent, rightSidebarContent } = useLayoutContext();
  const location = useLocation();

  // Close right sidebar when route changes
  useEffect(() => {
    closeRightSidebar();
  }, [location.pathname]);

  // Close right sidebar when tab changes (except for tasks tab)
  useEffect(() => {
    if (currentTab !== 'tasks') {
      closeRightSidebar();
    }
  }, [currentTab]);

  // When right sidebar opens, collapse left sidebar
  const handleRightSidebarContent = (content: ReactNode) => {
    setRightSidebarContent(content);
    if (content) {
      setIsLeftSidebarOpen(false);
    }
  };

  return (
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
  );
};

export default Layout;
