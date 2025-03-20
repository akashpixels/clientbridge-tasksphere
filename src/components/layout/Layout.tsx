
import { useState, useEffect } from 'react';
import { useLayout } from '@/context/layout';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MainContentArea from './MainContentArea';

const Layout = () => {
  const { setRightSidebarContent } = useLayout();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  
  useEffect(() => {
    console.log('Layout: Component mounted');
    return () => {
      console.log('Layout: Component unmounted');
    };
  }, []);

  console.log('Layout: Rendering');
  
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
