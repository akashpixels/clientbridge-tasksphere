
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
    <div className="min-h-screen bg-[#f8f8f8]">
      <Topbar />
      <div className="flex pt-16"> {/* Add top padding to account for fixed topbar */}
        <LeftSidebar 
          isOpen={isLeftSidebarOpen} 
          onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} 
        />
        
        <MainContentArea isLeftSidebarOpen={isLeftSidebarOpen} />

        <RightSidebar />
      </div>
    </div>
  );
};

export default Layout;
