
import { cn } from '@/lib/utils';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';

const Layout = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isCommentsSidebarOpen, setIsCommentsSidebarOpen] = useState(false);

  return (
   <div className="min-h-screen bg-[#f8f8f8] flex">
  {/* Left Sidebar */}
  <Sidebar 
    isOpen={isOpen && !isCommentsSidebarOpen} 
    onToggle={() => setIsOpen(!isOpen)} 
  />

  {/* Main Content Wrapper */}
  <div className={cn(
    "flex transition-all duration-300 ease-in-out w-full",
    isCommentsSidebarOpen ? "mr-96" : "mr-0"
  )}>
    {/* Main Content */}
    <main className={cn(
      "transition-all duration-300 ease-in-out flex-1",
      isOpen && !isCommentsSidebarOpen ? "ml-64" : "ml-20"
    )}>
      <div className="p-8">
        <Outlet context={{ setIsCommentsSidebarOpen }} />
      </div>
    </main>

    {/* Right Sidebar (Comments Panel) */}
    {isCommentsSidebarOpen && (
      <div className="w-96 bg-white h-screen border-l fixed right-0 top-0">
        {/* Your comments UI here */}
      </div>
    )}
  </div>
</div>

  );
};

export default Layout;
