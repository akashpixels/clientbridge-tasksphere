import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const SidebarFooter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      navigate('/auth');
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="absolute bottom-6 left-4 right-4">
      <button
        onClick={handleLogout}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-[6px] transition-all',
          'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        <div className="min-w-[20px]">
          <LogOut size={20} />
        </div>
        <span className="text-sm font-medium">
          Logout
        </span>
      </button>
    </div>
  );
};

export default SidebarFooter;