import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";

const SidebarHeader = () => {
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

  return (
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
        "opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto overflow-hidden whitespace-nowrap"
      )}>
        {agencyName}
      </h1>
    </div>
  );
};

export default SidebarHeader;