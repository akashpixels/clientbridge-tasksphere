
import { cn } from '@/lib/utils';
import { ReactNode, useState } from 'react';
import { useLayout } from '@/context/layout';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MainContentArea from './MainContentArea';
import Topbar from './Topbar';

const Layout = () => {
  const { setRightSidebarContent } = useLayout();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex">
      <LeftSidebar 
        isOpen={isLeftSidebarOpen} 
        onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} 
      />
      
      <div className="flex-1 flex flex-col">
        <Topbar />
        <MainContentArea isLeftSidebarOpen={false} />
      </div>

      <RightSidebar />
    </div>
  );
};

export default Layout;
