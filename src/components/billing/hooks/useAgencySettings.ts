
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AgencyGSTDetails, TDSRate } from "../types";

export const useAgencySettings = () => {
  return useQuery({
    queryKey: ['agency-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_settings')
        .select('*')
        .in('key', ['indian_states', 'agency_gst_details', 'tds_rates', 'billing_sequences', 'agency_details']);

      if (error) throw error;

      const settings = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);

      return {
        indianStates: settings.indian_states as string[],
        agencyGSTDetails: settings.agency_gst_details as AgencyGSTDetails,
        tdsRates: settings.tds_rates as TDSRate[],
        billingSequences: settings.billing_sequences,
        agencyDetails: settings.agency_details || {
          name: 'Your Agency',
          address: 'Agency Address',
          email: '',
          phone: ''
        }
      };
    },
  });
};

export const useClientDetails = (clientId: string | undefined) => {
  return useQuery({
    queryKey: ['client-details', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from('client_admins')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) {
        console.error('Error fetching client details:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!clientId, // Only run query if clientId is available
  });
};

export const useClientAdmins = () => {
  return useQuery({
    queryKey: ['client-admins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_admins')
        .select('*')
        .order('business_name');

      if (error) throw error;
      return data;
    },
  });
};
