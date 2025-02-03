import { cn } from '@/lib/utils';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';

const Layout = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="flex">
        <Sidebar isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
        <main className={cn(
          'flex-1 transition-all duration-300 ease-in-out',
          isOpen ? 'pl-64' : 'pl-20'
        )}>
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;