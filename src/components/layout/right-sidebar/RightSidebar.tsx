
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RightSidebarProps {
  isOpen: boolean;
  children?: ReactNode;
}

const RightSidebar = ({ isOpen, children }: RightSidebarProps) => {
  return (
    <aside 
      className={cn(
        "w-[400px] bg-background border-l border-border/40 overflow-y-auto transition-all duration-300",
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {children}
    </aside>
  );
};

export default RightSidebar;
