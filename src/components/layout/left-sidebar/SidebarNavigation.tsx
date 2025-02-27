
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, CheckSquare, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  requiredRoles?: number[];
}

interface SidebarNavigationProps {
  isOpen: boolean;
}

const SidebarNavigation = ({ isOpen }: SidebarNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const { data: userRole } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_role_id')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return data?.user_role_id;
    },
  });

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <Home size={20} />, href: '/' },
    { label: 'Projects', icon: <Briefcase size={20} />, href: '/projects' },
    { label: 'Tasks', icon: <CheckSquare size={20} />, href: '/tasks' },
    { label: 'Team', icon: <Users size={20} />, href: '/team' },
    { 
      label: 'Clients', 
      icon: <FileText size={20} />, 
      href: '/clients',
      requiredRoles: [1] // Only Agency Admin (role_id = 1)
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.requiredRoles || (userRole && item.requiredRoles.includes(userRole))
  );

  return (
    <nav className="space-y-2">
      {filteredNavItems.map((item) => {
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
