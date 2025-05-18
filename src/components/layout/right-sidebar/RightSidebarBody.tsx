
import { useLayout } from '@/context/layout';
import { ScrollArea } from '@/components/ui/scroll-area';

const RightSidebarBody = () => {
  const { rightSidebarContent } = useLayout();

  return (
    <ScrollArea className="flex-1">
      <div className="p-4">
        {rightSidebarContent}
      </div>
    </ScrollArea>
  );
};

export default RightSidebarBody;
