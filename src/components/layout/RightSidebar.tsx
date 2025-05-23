
import { useLayout } from '@/context/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RightSidebar = () => {
  const { rightSidebarContent, closeRightSidebar } = useLayout();
  const isMobile = useIsMobile();

  if (!rightSidebarContent) return null;

  // On mobile, take full width or use fixed position on desktop
  const sidebarClass = isMobile 
    ? "fixed inset-0 z-50 bg-background" 
    : "fixed top-0 right-0 w-[320px] bg-background border-l border-border h-screen flex flex-col z-50";

  return (
    <aside className={sidebarClass}>
      {isMobile && (
        <div className="flex justify-end p-2">
          <Button variant="ghost" size="icon" onClick={closeRightSidebar}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <ScrollArea className="flex-1 overflow-auto">
        {rightSidebarContent}
      </ScrollArea>
    </aside>
  );
};

export default RightSidebar;
