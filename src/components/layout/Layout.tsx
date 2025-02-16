import { cn } from '@/lib/utils';
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/router'; // Import Next.js router
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
  const router = useRouter(); // Initialize router
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [rightSidebarContent, setRightSidebarContent] = useState<ReactNode | null>(null);

  const setRightSidebar = (content: ReactNode) => {
    setRightSidebarContent(content);
    if (content) {
      setIsLeftSidebarOpen(false); // Collapse left sidebar when right sidebar opens
    }
  };

  const closeRightSidebar = () => setRightSidebarContent(null);

  // Close the right sidebar when the route changes
  useEffect(() => {
    const handleRouteChange = () => closeRightSidebar();
    router.events.on('routeChangeStart', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  const context: LayoutContext = {
    setRightSidebarContent: setRightSidebar,
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
