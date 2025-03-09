
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import SidebarHeader from './left-sidebar/SidebarHeader';
import SidebarNavigation from './left-sidebar/SidebarNavigation';
import SidebarFooter from './left-sidebar/SidebarFooter';

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const LeftSidebar = ({ isOpen, onToggle }: LeftSidebarProps) => {
  return (
    <aside
      className={cn(
        'h-screen bg-background border-r border-border/40',
        isOpen ? 'w-64' : 'w-20',
        'transition-all duration-300 ease-in-out'
      )}
    >
      <button
        onClick={onToggle}
        className="absolute top-6 z-10 bg-background border border-border/40 rounded-full p-1.5 hover:bg-gray-100"
        style={{ right: isOpen ? '-12px' : '-12px', transform: isOpen ? 'none' : 'rotate(180deg)' }}
      >
        <ChevronLeft className="h-4 w-4 text-gray-600" />
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

export default LeftSidebar;
