
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Users, FileText, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadMessages } from '@/hooks/use-unread-messages';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface SidebarNavigationProps {
  isOpen: boolean;
}

const SidebarNavigation = ({ isOpen }: SidebarNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useUnreadMessages();

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <Home size={20} />, href: '/' },
    { label: 'Projects', icon: <Briefcase size={20} />, href: '/projects' },
    { label: 'Team', icon: <Users size={20} />, href: '/team' },
    { label: 'Clients', icon: <FileText size={20} />, href: '/clients' },
    { 
      label: 'Chat', 
      icon: <MessageCircle size={20} />, 
      href: '/chat', 
      badge: unreadCount 
    },
  ];

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
            <div className="relative min-w-[20px]">
              {item.icon}
              {!!item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
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

export default SidebarNavigation;
