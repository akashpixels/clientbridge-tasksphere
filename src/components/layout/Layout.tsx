
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

  {/* Main Layout Wrapper */}
  <div className="flex flex-1 transition-all duration-300 ease-in-out">
    {/* Main Content */}
    <main className={cn(
      "flex-1 transition-all duration-300 ease-in-out min-w-0",  // Ensure flex-1 behaves correctly
      isOpen && !isCommentsSidebarOpen ? "ml-64" : "ml-20"
    )}>
      <div className="p-8">
        <Outlet context={{ setIsCommentsSidebarOpen }} />
      </div>
    </main>

    {/* Right Sidebar (Comments Panel) */}
    <div className={cn(
      "transition-all duration-300 ease-in-out bg-white border-l h-screen",
      isCommentsSidebarOpen ? "w-96" : "w-0"
    )}>
      {isCommentsSidebarOpen && (
        <div className="w-96 h-full">
          {/* Your comments UI */}
        </div>
      )}
    </div>
  </div>
</div>


  );
};

export default Layout;
