
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RightSidebarProps {
  content: ReactNode;
  isOpen: boolean;
}

const RightSidebar = ({ content, isOpen }: RightSidebarProps) => {
  return (
    <aside 
      className={cn(
        'h-full bg-background border-l border-border/40 transition-all duration-300 ease-in-out',
        'fixed top-0 right-0 w-[400px]',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {content}
    </aside>
  );
};

export default RightSidebar;
