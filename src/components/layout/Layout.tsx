
import { useState, useEffect } from 'react';
import { useLayout } from '@/context/layout';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MainContentArea from './MainContentArea';
import { useLocation } from 'react-router-dom';

const Layout = () => {
  const { setRightSidebarContent } = useLayout();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    console.log('Layout: Component mounted');
    console.log('Layout: Current path', location.pathname);
    return () => {
      console.log('Layout: Component unmounted');
    };
  }, [location.pathname]);

  console.log('Layout: Rendering with path', location.pathname);
  
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
