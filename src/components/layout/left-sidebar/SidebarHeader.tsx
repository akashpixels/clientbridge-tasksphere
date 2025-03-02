
interface SidebarHeaderProps {
  isOpen: boolean;
}

const SidebarHeader = ({ isOpen }: SidebarHeaderProps) => {
  return (
    <div className="mb-8">
      <h2 className={`font-semibold text-xl ${!isOpen && 'text-center'}`}>
        {isOpen ? 'Agency OS' : 'A'}
      </h2>
    </div>
  );
};

export default SidebarHeader;
