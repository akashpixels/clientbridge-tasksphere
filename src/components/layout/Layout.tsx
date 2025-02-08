
import { cn } from '@/lib/utils';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';

const Layout = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isCommentsSidebarOpen, setIsCommentsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="flex">
        <Sidebar 
          isOpen={isOpen && !isCommentsSidebarOpen} 
          onToggle={() => setIsOpen(!isOpen)} 
        />
        <main className={cn(
          'flex-1 transition-all duration-300 ease-in-out relative',
          isOpen && !isCommentsSidebarOpen ? 'ml-64' : 'ml-20',
          isCommentsSidebarOpen && 'mr-96'
        )}>
          <div className="p-8">
            <Outlet context={{ setIsCommentsSidebarOpen }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
