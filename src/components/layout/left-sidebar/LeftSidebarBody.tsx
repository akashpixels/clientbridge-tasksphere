
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface LeftSidebarBodyProps {
  isOpen: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <Home size={20} />, href: '/' },
  { label: 'Projects', icon: <Briefcase size={20} />, href: '/projects' },
  { label: 'Team', icon: <Users size={20} />, href: '/team' },
  { label: 'Clients', icon: <FileText size={20} />, href: '/clients' },
];

const LeftSidebarBody = ({ isOpen }: LeftSidebarBodyProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <button
            key={item.href}
            onClick={() => navigate(item.href)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-[6px] transition-all',
              'text-gray-700 hover:text-gray-900 hover:bg-muted',
              isActive && 'bg-muted text-gray-900'
            )}
          >
            <div className="min-w-[20px]">
              {item.icon}
            </div>
            {isOpen && (
              <span className="text-sm font-medium truncate">
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default LeftSidebarBody;
