
import { useLayout } from '@/context/layout';
import { Button } from '@/components/ui/button';

const RightSidebarFooter = () => {
  const { closeRightSidebar } = useLayout();

  return (
    <div className="p-4 border-t border-border">
      <Button 
        variant="outline" 
        onClick={closeRightSidebar}
        className="w-full"
      >
        Close
      </Button>
    </div>
  );
};

export default RightSidebarFooter;
