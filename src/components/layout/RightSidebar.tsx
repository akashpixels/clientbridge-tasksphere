
import { useLayout } from '@/context/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

const RightSidebar = () => {
  const { rightSidebarContent } = useLayout();
  const isMobile = useIsMobile();

  if (!rightSidebarContent) return null;

  // On mobile, take full width or use fixed position on desktop
  const sidebarClass = isMobile 
    ? "fixed inset-0 z-50 bg-background" 
    : "fixed top-0 right-0 w-[300px] bg-background border-l border-border h-screen";

  return (
    <aside className={sidebarClass}>
      <ScrollArea className="h-screen">
        <div className="p-4">
          {rightSidebarContent}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default RightSidebar;
