
interface SidebarFooterProps {
  isOpen: boolean;
}

const SidebarFooter = ({ isOpen }: SidebarFooterProps) => {
  return (
    <div className="mt-auto pt-4">
      {isOpen ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>v1.0.0</span>
        </div>
      ) : (
        <div className="text-center text-xs text-muted-foreground">
          v1
        </div>
      )}
    </div>
  );
};

export default SidebarFooter;
