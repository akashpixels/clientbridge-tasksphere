import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Briefcase, CheckSquare, Users, FileText, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const Sidebar = () => {
  const [isOpen] = useState(false);
  const navigate = useNavigate();
  const [agencyLogo, setAgencyLogo] = useState('');
  const [agencyName, setAgencyName] = useState('');

  useEffect(() => {
    const fetchAgencyDetails = async () => {
      const { data: logoData } = await supabase
        .from('agency_details')
        .select('value')
        .eq('key', 'logo_url')
        .single();

      const { data: nameData } = await supabase
        .from('agency_details')
        .select('value')
        .eq('key', 'agency_shortname')
        .single();

      if (logoData?.value) {
        setAgencyLogo(logoData.value.toString());
      }
      if (nameData?.value) {
        setAgencyName(nameData.value.toString());
      }
    };

    fetchAgencyDetails();
  }, []);

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
        'w-20 group hover:w-64'
      )}
    >
      <div className="glass-card h-full px-4 py-6">
        <div className="flex items-center mb-8 pl-3">
          {agencyLogo && (
            <img 
              src={agencyLogo} 
              alt="Agency Logo" 
              className="h-8 w-8 min-w-[32px] object-contain"
            />
          )}
          <h1 className={cn(
            "font-display font-bold transition-all duration-300 ml-3",
            "text-xl",
            "opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto overflow-hidden whitespace-nowrap"
          )}>
            {agencyName}
          </h1>
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
              <div className="min-w-[20px]">
                {item.icon}
              </div>
              <span className={cn(
                "transition-all duration-300",
                "opacity-0 w-0 overflow-hidden whitespace-nowrap",
                "group-hover:opacity-100 group-hover:w-auto"
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
            <div className="min-w-[20px]">
              <LogOut size={20} />
            </div>
            <span className={cn(
              "transition-all duration-300",
              "opacity-0 w-0 overflow-hidden whitespace-nowrap",
              "group-hover:opacity-100 group-hover:w-auto"
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