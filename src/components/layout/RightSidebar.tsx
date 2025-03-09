
import { useLayout } from '@/context/layout';

const RightSidebar = () => {
  const { rightSidebarContent } = useLayout();

  if (!rightSidebarContent) return null;

  return (
    <aside className="fixed top-16 right-0 w-[300px] bg-background border-l border-border/40 h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {rightSidebarContent}
    </aside>
  );
};

export default RightSidebar;
