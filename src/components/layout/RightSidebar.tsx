
import { ReactNode } from 'react';

interface RightSidebarProps {
  content: ReactNode | null;
}

const RightSidebar = ({ content }: RightSidebarProps) => {
  if (!content) return null;

  return (
    <aside className="fixed top-0 right-0 h-full w-[300px] bg-background border-l border-border/40 overflow-y-auto">
      {content}
    </aside>
  );
};

export default RightSidebar;
