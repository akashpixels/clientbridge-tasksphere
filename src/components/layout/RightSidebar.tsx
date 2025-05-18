
import { useLayout } from '@/context/layout';
import { useIsMobile } from '@/hooks/use-mobile';
import RightSidebarHeader from './right-sidebar/RightSidebarHeader';
import RightSidebarBody from './right-sidebar/RightSidebarBody';
import RightSidebarFooter from './right-sidebar/RightSidebarFooter';

const RightSidebar = () => {
  const { rightSidebarContent } = useLayout();
  const isMobile = useIsMobile();

  if (!rightSidebarContent) return null;

  // On mobile, take full width or use fixed position on desktop
  const sidebarClass = isMobile 
    ? "fixed inset-0 z-50 bg-background flex flex-col" 
    : "fixed top-0 right-0 w-[300px] bg-background border-l border-border h-screen flex flex-col";

  return (
    <aside className={sidebarClass}>
      <RightSidebarHeader />
      <RightSidebarBody />
      <RightSidebarFooter />
    </aside>
  );
};

export default RightSidebar;
