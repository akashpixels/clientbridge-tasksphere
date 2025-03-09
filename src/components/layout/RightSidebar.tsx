
import { useLayout } from '@/context/layout';

const RightSidebar = () => {
  const { rightSidebarContent } = useLayout();

  if (!rightSidebarContent) return null;

  return (
    <aside className="fixed top-[46px] right-0 w-[300px] bg-background border-l border-border/40 h-[calc(100vh-46px)] flex flex-col overflow-hidden">
      {rightSidebarContent}
    </aside>
  );
};

export default RightSidebar;
