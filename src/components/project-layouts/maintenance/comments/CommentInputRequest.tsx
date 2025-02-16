
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Toggle } from "@/components/ui/toggle";

interface CommentInputRequestProps {
  isInputResponse?: boolean;
  isRequestingInput: boolean;
  setIsRequestingInput: (value: boolean) => void;
}

const CommentInputRequest = ({
  isInputResponse,
  isRequestingInput,
  setIsRequestingInput,
}: CommentInputRequestProps) => {
  const [isAgencyUser, setIsAgencyUser] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user) {
        console.log("Checking user role for user:", session.user.id);
        
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select(`
            id,
            user_role_id,
            user_roles!user_profiles_user_role_id_fkey (
              id,
              name
            )
          `)
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user role:", error);
          return;
        }

        console.log("Full user profile data:", userProfile);
        
        const isAgency = 
          userProfile?.user_roles?.name === 'Agency Admin' || 
          userProfile?.user_roles?.name === 'Agency Staff';
        
        console.log("Is agency user:", isAgency);
        console.log("Role name:", userProfile?.user_roles?.name);
        
        setIsAgencyUser(isAgency);
      }
    };

    checkUserRole();
  }, [session]);

  if (!isAgencyUser || isInputResponse) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-2">
      <Toggle
        pressed={isRequestingInput}
        onPressedChange={setIsRequestingInput}
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        Request Input
      </Toggle>
    </div>
  );
};

export default CommentInputRequest;
