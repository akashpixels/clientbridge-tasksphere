
import { cn } from '@/lib/utils';
import { Outlet } from 'react-router-dom';
import { useLayout } from '@/context/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainContentAreaProps {
  isLeftSidebarOpen: boolean;
}

const MainContentArea = ({ isLeftSidebarOpen }: MainContentAreaProps) => {
  const { rightSidebarContent } = useLayout();
  const isMobile = useIsMobile();
  
  // Only apply margin-right for desktop when right sidebar is open
  const rightMargin = (!isMobile && rightSidebarContent) ? 'mr-[300px]' : '';
  
  return (
    <main 
      className={cn(
        'flex-1 transition-all duration-300 ease-in-out bg-background',
        isLeftSidebarOpen ? (isMobile ? 'ml-0' : 'ml-64') : (isMobile ? 'ml-0' : 'ml-20'),
        rightMargin
      )}
    >
      <ScrollArea className="h-screen w-full">
        <div className="p-8">
          <Outlet />
        </div>
      </ScrollArea>
    </main>
  );
};

export default MainContentArea;
