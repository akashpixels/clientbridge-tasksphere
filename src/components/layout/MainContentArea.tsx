
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
  
  return (
    <main 
      className={cn(
        'flex-1 transition-all duration-300 ease-in-out bg-background hide-scrollbar',
        isLeftSidebarOpen ? (isMobile ? 'ml-0' : 'ml-64') : (isMobile ? 'ml-0' : 'ml-20'),
        rightSidebarContent ? (isMobile ? 'mr-0' : 'mr-[300px]') : ''
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
