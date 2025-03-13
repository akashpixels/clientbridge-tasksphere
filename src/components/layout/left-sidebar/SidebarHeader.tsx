
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
      const { data: logoData } = await supabase
        .from('agency_settings')
        .select('value')
        .eq('key', 'logo_url')
        .single();

      const { data: nameData } = await supabase
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
