
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import LeftSidebarHeader from './left-sidebar/LeftSidebarHeader';
import LeftSidebarBody from './left-sidebar/LeftSidebarBody';
import LeftSidebarFooter from './left-sidebar/LeftSidebarFooter';

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const LeftSidebar = ({ isOpen, onToggle }: LeftSidebarProps) => {
  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen bg-background border-r border-border',
        isOpen ? 'w-64' : 'w-20',
        'transition-all duration-300 ease-in-out'
      )}
    >
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 bg-background border border-border rounded-full p-1.5 hover:bg-secondary"
      >
        <ChevronLeft className={cn(
          "h-4 w-4 text-gray-600 transition-transform",
          !isOpen && "rotate-180"
        )} />
      </button>
      <div className="h-full flex flex-col px-4 py-6">
        <LeftSidebarHeader isOpen={isOpen} />
        <div className="flex-1 overflow-y-auto">
          <LeftSidebarBody isOpen={isOpen} />
        </div>
        <LeftSidebarFooter isOpen={isOpen} />
      </div>
    </aside>
  );
};

export default LeftSidebar;
