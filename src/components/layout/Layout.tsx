import { cn } from '@/lib/utils';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './left-sidebar/LeftSidebar';
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
          'flex-1 flex transition-all duration-300 ease-in-out relative',
          isLeftSidebarOpen ? 'ml-64' : 'ml-20'
        )}>
          <main className={cn(
            'flex-1 overflow-auto transition-all duration-300 ease-in-out',
            rightSidebarContent ? 'mr-[400px]' : ''
          )}>
            <div className="p-8">
              <Outlet />
            </div>
          </main>

          {rightSidebarContent && (
            <aside className="fixed top-0 right-0 w-[400px] h-full bg-background border-l border-border/40">
              {rightSidebarContent}
            </aside>
          )}
        </div>
      </div>
    </LayoutContext.Provider>
  );
};

export default Layout;
