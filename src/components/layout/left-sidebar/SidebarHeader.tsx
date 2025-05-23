
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";

interface SidebarHeaderProps {
  isOpen: boolean;
}

const SidebarHeader = ({ isOpen }: SidebarHeaderProps) => {
  const [agencyLogo, setAgencyLogo] = useState('');
  const [agencyName, setAgencyName] = useState('');

  useEffect(() => {
    const fetchAgencyDetails = async () => {
      try {
        // Use the new table name "agency_settings" instead of "agency_details"
        const { data: logoData, error: logoError } = await supabase
          .from('agency_settings')
          .select('value')
          .eq('key', 'icon_url')
          .single();

        const { data: nameData, error: nameError } = await supabase
          .from('agency_settings')
          .select('value')
          .eq('key', 'agency_shortname')
          .single();

        if (logoData?.value) {
          setAgencyLogo(logoData.value.toString());
        }
        if (nameData?.value) {
          setAgencyName(nameData.value.toString());
        }
        
        // Log any errors for debugging
        if (logoError) console.error('Error fetching logo:', logoError);
        if (nameError) console.error('Error fetching agency name:', nameError);
      } catch (error) {
        console.error('Error fetching agency settings:', error);
      }
    };

    fetchAgencyDetails();
  }, []);

  return (
    <div className="flex items-center mb-8 pl-3">
      {agencyLogo && (
        <img 
          src={agencyLogo} 
          alt="Agency Logo" 
          className="h-8 w-8 min-w-[32px] object-contain"
        />
      )}
      {isOpen && (
        <h1 className="font-display font-bold text-xl ml-3 truncate">
          {agencyName}
        </h1>
      )}
    </div>
  );
};

export default SidebarHeader;
