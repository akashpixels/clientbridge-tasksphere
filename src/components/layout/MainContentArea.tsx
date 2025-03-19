
import { cn } from '@/lib/utils';
import { Outlet } from 'react-router-dom';
import { useLayout } from '@/context/layout';

interface MainContentAreaProps {
  isLeftSidebarOpen: boolean;
}

const MainContentArea = ({ isLeftSidebarOpen }: MainContentAreaProps) => {
  const { rightSidebarContent } = useLayout();
  
  return (
    <main 
      className={cn(
        'flex-1 transition-all duration-300 ease-in-out bg-background hide-scrollbar',
        isLeftSidebarOpen ? 'ml-64' : 'ml-20',
        rightSidebarContent ? 'mr-[300px]' : ''
      )}
    >
      <div className="p-8 overflow-auto hide-scrollbar">
        <Outlet />
      </div>
    </main>
  );
};

export default MainContentArea;
