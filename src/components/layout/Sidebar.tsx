import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Home, Briefcase, CheckSquare, Users, FileText, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <Home size={20} />, href: '/' },
    { label: 'Projects', icon: <Briefcase size={20} />, href: '/projects' },
    { label: 'Tasks', icon: <CheckSquare size={20} />, href: '/tasks' },
    { label: 'Team', icon: <Users size={20} />, href: '/team' },
    { label: 'Clients', icon: <FileText size={20} />, href: '/clients' },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300',
        isOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className="glass-card h-full rounded-r-lg px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className={cn(
            "font-display font-bold transition-all duration-300",
            isOpen ? "text-xl" : "text-xs"
          )}>
            Portal
          </h1>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-100',
                'text-gray-700 hover:text-gray-900'
              )}
            >
              {item.icon}
              <span className={cn(
                "transition-all duration-300",
                isOpen ? "opacity-100" : "opacity-0 w-0"
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <button
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg transition-all',
              'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <LogOut size={20} />
            <span className={cn(
              "transition-all duration-300",
              isOpen ? "opacity-100" : "opacity-0 w-0"
            )}>
              Logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;