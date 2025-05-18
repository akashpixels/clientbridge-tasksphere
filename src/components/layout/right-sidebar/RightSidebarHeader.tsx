
import { useLayout } from '@/context/layout';
import { X } from 'lucide-react';

const RightSidebarHeader = () => {
  const { closeRightSidebar } = useLayout();

  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <h2 className="font-medium">Details</h2>
      <button 
        onClick={closeRightSidebar}
        className="p-1 rounded-md hover:bg-gray-100"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default RightSidebarHeader;
