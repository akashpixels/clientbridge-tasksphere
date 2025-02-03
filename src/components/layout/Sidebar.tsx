import { useState } from 'react';
import { cn } from '@/lib/utils';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarNavigation from './sidebar/SidebarNavigation';
import SidebarFooter from './sidebar/SidebarFooter';

const Sidebar = () => {
  const [isOpen] = useState(false);

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen z-40 transition-all duration-300',
        'w-20 group/sidebar hover:w-64'
      )}
    >
      <div className="glass-card h-full flex flex-col px-4 py-6">
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