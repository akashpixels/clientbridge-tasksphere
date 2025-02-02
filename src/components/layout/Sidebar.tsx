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
        'h-screen transition-all duration-300',
        'w-20 group/sidebar hover:w-64'
      )}
    >
      <div className="glass-card h-full px-4 py-6">
        <SidebarHeader />
        <SidebarNavigation />
        <SidebarFooter />
      </div>
    </aside>
  );
};

export default Sidebar;