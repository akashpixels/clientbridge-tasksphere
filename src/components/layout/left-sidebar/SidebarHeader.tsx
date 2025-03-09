interface SidebarHeaderProps {
  isOpen: boolean;
}

const SidebarHeader = ({ isOpen }: SidebarHeaderProps) => {
  return (
    <div className="mb-8 pl-3">
      {/* Logo and agency name moved to Topbar */}
    </div>
  );
};

export default SidebarHeader;
