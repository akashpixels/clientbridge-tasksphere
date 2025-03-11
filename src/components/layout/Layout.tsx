
import { cn } from '@/lib/utils';
import { ReactNode, useState } from 'react';
import { useLayout } from '@/context/layout';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MainContentArea from './MainContentArea';

const Layout = () => {
  const {
    setRightSidebarContent
  } = useLayout();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  
  return <div className="min-h-screen bg-[#f9f9fa]">
      <div className="flex">
        <LeftSidebar isOpen={isLeftSidebarOpen} onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} />
        
        <MainContentArea isLeftSidebarOpen={isLeftSidebarOpen} />

        <RightSidebar />
      </div>
    </div>;
};

export default Layout;
