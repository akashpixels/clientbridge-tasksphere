
import { cn } from '@/lib/utils';
import { Outlet, useLocation } from 'react-router-dom';
import { useLayout } from '@/context/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect } from 'react';

interface MainContentAreaProps {
  isLeftSidebarOpen: boolean;
}

const MainContentArea = ({ isLeftSidebarOpen }: MainContentAreaProps) => {
  const { rightSidebarContent, closeRightSidebar, currentTab, setCurrentTab } = useLayout();
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Add effect to close right sidebar on route change
  useEffect(() => {
    console.log('MainContentArea: Route changed to', location.pathname);
    closeRightSidebar();
  }, [location.pathname, closeRightSidebar]);
  
  // Add effect to log tab changes
  useEffect(() => {
    console.log('MainContentArea: Current tab is', currentTab);
  }, [currentTab]);
  
  // Check if the current route is the chat page
  const isChatPage = location.pathname === '/chat';
  
  console.log('MainContentArea: Rendering', { 
    isLeftSidebarOpen, 
    hasRightSidebar: !!rightSidebarContent, 
    isMobile, 
    path: location.pathname,
    currentTab,
    isChatPage
  });
  
  return (
    <main 
      className={cn(
        'flex-1 transition-all duration-300 ease-in-out bg-background',
        isLeftSidebarOpen ? (isMobile ? 'ml-0' : 'ml-64') : (isMobile ? 'ml-0' : 'ml-20'),
        rightSidebarContent ? (isMobile ? 'mr-0' : 'mr-[300px]') : ''
      )}
    >
      <ScrollArea className={cn(isChatPage ? 'h-full' : 'h-screen', 'w-full')}>
        <div className={cn(isChatPage ? 'p-0' : 'p-8')}>
          <Outlet />
        </div>
      </ScrollArea>
    </main>
  );
};

export default MainContentArea;
