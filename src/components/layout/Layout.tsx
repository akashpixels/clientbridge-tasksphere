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
  const [forceUpdate, setForceUpdate] = useState(0); // NEW FORCE UPDATE STATE

  const setRightSidebar = (content: ReactNode) => {
    setRightSidebarContent(content);
    setForceUpdate(prev => prev + 1); // FORCING RE-RENDER
    if (content) {
      setIsLeftSidebarOpen(false);
    }
  };

  const closeRightSidebar = () => {
    setRightSidebarContent(null);
    setForceUpdate(prev => prev + 1); // FORCING RE-RENDER
  };

  return (
    <LayoutContext.Provider value={{ setRightSidebarContent: setRightSidebar, closeRightSidebar }}>
      <div className="min-h-screen bg-[#f8f8f8]" key={forceUpdate}>
        <div className="flex">
          <LeftSidebar isOpen={isLeftSidebarOpen} onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} />
          <MainContentArea isLeftSidebarOpen={isLeftSidebarOpen} />
          <RightSidebar content={rightSidebarContent} />
        </div>
      </div>
    </LayoutContext.Provider>
  );
};

export default Layout;
