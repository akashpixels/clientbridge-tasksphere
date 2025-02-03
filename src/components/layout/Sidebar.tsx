import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarNavigation from './sidebar/SidebarNavigation';
import SidebarFooter from './sidebar/SidebarFooter';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen bg-background border-r border-border/40',
        isOpen ? 'w-64' : 'w-20',
        'transition-all duration-300 ease-in-out'
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-6 bg-background border border-border/40 rounded-full p-1.5 hover:bg-gray-100"
      >
        <ChevronLeft className={cn(
          "h-4 w-4 text-gray-600 transition-transform",
          !isOpen && "rotate-180"
        )} />
      </button>
      <div className="h-full flex flex-col px-4 py-6">
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto">
          <SidebarNavigation />
        </div>
        <SidebarFooter />
      </div>
    </aside>
  );
};

export default Sidebar;