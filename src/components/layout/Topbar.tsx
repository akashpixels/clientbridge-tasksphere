
import { Bell, Search, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface TopbarProps {
  showSearch?: boolean;
}

const Topbar = ({ showSearch = true }: TopbarProps) => {
  const location = useLocation();
  
  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    
    if (paths.length === 0) {
      return 'Dashboard';
    }
    
    return paths.map(path => {
      // Capitalize first letter and replace hyphens with spaces
      return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    }).join(' / ');
  };

  return (
    <div className="h-16 border-b border-border/40 flex items-center justify-between px-6 bg-background fixed w-full z-10 shadow-sm">
      <div className="text-lg font-medium">{generateBreadcrumbs()}</div>
      
      <div className="flex items-center gap-4">
        {showSearch && (
          <div className="hidden md:flex relative w-64">
            <Input 
              type="text" 
              placeholder="Search..." 
              className="pl-9 h-9"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] h-4 w-4 flex items-center justify-center rounded-full">3</span>
        </Button>
        
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">JD</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden md:inline-block">John Doe</span>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
