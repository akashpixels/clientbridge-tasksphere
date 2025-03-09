
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { supabase } from "@/integrations/supabase/client";

const Topbar = () => {
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
    <div className="h-[46px] border-b border-border/40 flex items-center justify-between px-6 bg-background fixed w-full z-10">
      <div className="flex items-center">
        {agencyLogo && (
          <img 
            src={agencyLogo} 
            alt="Agency Logo" 
            className="h-8 w-8 min-w-[32px] object-contain"
          />
        )}
        {agencyName && (
          <h1 className="font-display font-bold text-xl ml-3 truncate">
            {agencyName}
          </h1>
        )}
      </div>
      
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] h-4 w-4 flex items-center justify-center rounded-full">3</span>
        </Button>
      </div>
    </div>
  );
};

export default Topbar;
