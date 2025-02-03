import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarNavigation from './sidebar/SidebarNavigation';
import SidebarFooter from './sidebar/SidebarFooter';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen bg-background border-r border-border/40',
        isOpen ? 'w-64' : 'w-20',
        'transition-all duration-300 ease-in-out'
      )}
    >
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 hover:text-gray-900"
      >
        <ChevronLeft className={cn(
          "h-4 w-4 text-gray-600 transition-transform",
          !isOpen && "rotate-180"
        )} />
      </button>
      <div className="h-full flex flex-col px-4 py-6">
        <SidebarHeader isOpen={isOpen} />
        <div className="flex-1 overflow-y-auto">
          <SidebarNavigation isOpen={isOpen} />
        </div>
        <SidebarFooter isOpen={isOpen} />
      </div>
    </aside>
  );
};

export default Sidebar;