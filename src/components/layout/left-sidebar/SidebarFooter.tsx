
import { LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';

interface SidebarFooterProps {
  isOpen: boolean;
}

interface UserDetails {
  email: string | null;
  name?: string;
  userRole?: string;
  jobRole?: string;
}

const SidebarFooter = ({ isOpen }: SidebarFooterProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  // Fetch the current user and their details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select(`
            first_name, 
            last_name,
            user_role_id,
            job_role_id,
            user_roles(name),
            job_roles(name)
          `)
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          return;
        }

        setUserDetails({
          email: session.user.email,
          name: profileData ? `${profileData.first_name} ${profileData.last_name}` : undefined,
          userRole: profileData?.user_roles?.name,
          jobRole: profileData?.job_roles?.name,
        });

      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, []);

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
      {isOpen && userDetails && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <User size={16} className="text-gray-500" />
            <span className="text-sm font-medium truncate">
              {userDetails.name || 'User'}
            </span>
          </div>
          <span className="text-xs text-gray-500 block truncate mb-1">
            {userDetails.email || ''}
          </span>
          {(userDetails.userRole || userDetails.jobRole) && (
            <>
              <Separator className="my-2" />
              {userDetails.userRole && (
                <span className="text-xs text-gray-500 block truncate">
                  Role: {userDetails.userRole}
                </span>
              )}
              {userDetails.jobRole && (
                <span className="text-xs text-gray-500 block truncate">
                  Job: {userDetails.jobRole}
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Compact version for collapsed sidebar */}
      {!isOpen && userDetails && (
        <div className="mb-4 p-2 bg-gray-50 rounded-lg flex justify-center">
          <User size={20} className="text-gray-500" />
        </div>
      )}

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
        {isOpen && (
          <span className="text-sm font-medium truncate">
            Logout
          </span>
        )}
      </button>
    </div>
  );
};

export default SidebarFooter;
