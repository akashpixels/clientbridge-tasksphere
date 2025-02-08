
import { cn } from '@/lib/utils';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './left-sidebar/LeftSidebar';
import RightSidebar from './right-sidebar/RightSidebar';
import { useState, createContext, useContext, ReactNode } from 'react';

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

  const context: LayoutContext = {
    setRightSidebarContent,
    closeRightSidebar,
  };

  return (
    <LayoutContext.Provider value={context}>
      <div className="min-h-screen h-screen flex bg-[#f8f8f8] overflow-hidden">
        <LeftSidebar 
          isOpen={isLeftSidebarOpen} 
          onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} 
        />
        
        <div className={cn(
          'flex-1 transition-all duration-300 ease-in-out',
          isLeftSidebarOpen ? 'ml-64' : 'ml-20',
          rightSidebarContent ? 'mr-[400px]' : ''
        )}>
          <main className="h-full overflow-auto">
            <div className="p-8">
              <Outlet />
            </div>
          </main>
        </div>

        <RightSidebar 
          content={rightSidebarContent}
          isOpen={!!rightSidebarContent}
        />
      </div>
    </LayoutContext.Provider>
  );
};

export default Layout;
