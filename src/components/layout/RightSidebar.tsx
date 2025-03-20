
import { useLayout } from '@/context/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const RightSidebar = () => {
  const { rightSidebarContent, closeRightSidebar } = useLayout();
  const isMobile = useIsMobile();

  if (!rightSidebarContent) return null;

  // On mobile, take full width or use fixed position on desktop
  const sidebarClass = isMobile 
    ? "fixed inset-0 z-50 bg-background" 
    : "fixed top-0 right-0 w-[300px] border-l border-border h-screen flex flex-col z-40";

  return (
    <aside className={sidebarClass}>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Additional Information</h3>
        <Button variant="ghost" size="icon" onClick={closeRightSidebar}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {rightSidebarContent}
      </ScrollArea>
    </aside>
  );
};

export default RightSidebar;
