
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

  const closeRightSidebar = () => setRightSidebarContent(null);

  const openRightSidebar = (content: ReactNode) => {
    setRightSidebarContent(content);
    setIsLeftSidebarOpen(false); // ✅ Collapse Left Sidebar when Right Sidebar Opens
  };

  const context: LayoutContext = {
    setRightSidebarContent: openRightSidebar,
    closeRightSidebar,
  };

  return (
    <LayoutContext.Provider value={context}>
      <div className="min-h-screen bg-[#f8f8f8] flex">
        {/* Left Sidebar */}
        <LeftSidebar 
          isOpen={isLeftSidebarOpen} 
          onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} 
        />

        {/* Main Content Area */}
        <main 
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out p-8",
            isLeftSidebarOpen ? "ml-64" : "ml-20",  // ✅ Collapse when Right Sidebar opens
            rightSidebarContent ? "mr-[300px]" : "" // ✅ Push content when Right Sidebar opens
          )}
        >
          <MainContentArea />
        </main>

        {/* Right Sidebar */}
        <RightSidebar content={rightSidebarContent} />
      </div>
    </LayoutContext.Provider>
  );
};

export default Layout;
