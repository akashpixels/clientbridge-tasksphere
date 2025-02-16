import { ReactNode } from 'react';

interface RightSidebarProps {
  content: ReactNode | null;
}

const RightSidebar = ({ content }: RightSidebarProps) => {
  return (
    <aside
      className={`transition-all duration-300 ease-in-out ${
        content ? 'w-[300px] bg-background border-l border-border/40 h-screen flex flex-col' : 'hidden'
      }`}
    >
      {content}
    </aside>
  );
};

export default RightSidebar;
