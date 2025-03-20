
import { useState } from 'react';
import { useLayout } from '@/context/layout';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MainContentArea from './MainContentArea';

const Layout = () => {
  const { setRightSidebarContent, closeRightSidebar } = useLayout();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  
  return (
    <div className="min-h-screen bg-background">
      <div className="flex relative">
        <LeftSidebar isOpen={isLeftSidebarOpen} onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} />
        
        <MainContentArea isLeftSidebarOpen={isLeftSidebarOpen} />

        <RightSidebar />
      </div>
    </div>
  );
};

export default Layout;
