
import { cn } from '@/lib/utils';
import { createContext, useContext, ReactNode, useState } from 'react';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MainContentArea from './MainContentArea';

type LayoutContext = {
  setRightSidebarContent: (content: ReactNode) => void;
  closeRightSidebar: () => void;
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

   const setRightSidebar = (content: ReactNode) => {
    setRightSidebarContent(content);
    if (content) {
      setIsLeftSidebarOpen(false); // Collapse left sidebar when right sidebar is opened
    }
  };

  const closeRightSidebar = () => setRightSidebarContent(null);

  const context: LayoutContext = {
    setRightSidebarContent,
    closeRightSidebar,
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
