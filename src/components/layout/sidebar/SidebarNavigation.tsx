import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, CheckSquare, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <Home size={20} />, href: '/' },
  { label: 'Projects', icon: <Briefcase size={20} />, href: '/projects' },
  { label: 'Tasks', icon: <CheckSquare size={20} />, href: '/tasks' },
  { label: 'Team', icon: <Users size={20} />, href: '/team' },
  { label: 'Clients', icon: <FileText size={20} />, href: '/clients' },
];

const SidebarNavigation = () => {
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
              'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
              isActive && 'bg-gray-100 text-gray-900'
            )}
          >
            <div className="min-w-[20px]">
              {item.icon}
            </div>
            <span className={cn(
              "transition-all duration-300",
              "opacity-0 w-0 overflow-hidden whitespace-nowrap",
              "group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto"
            )}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default SidebarNavigation;