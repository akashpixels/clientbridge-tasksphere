
import { useLayout } from '@/context/layout';

const RightSidebar = () => {
  const { rightSidebarContent } = useLayout();

  if (!rightSidebarContent) return null;

  return (
    <aside className="w-[300px] bg-background border-l border-border/40 h-screen flex flex-col">
      {rightSidebarContent}
    </aside>
  );
};

export default RightSidebar;
