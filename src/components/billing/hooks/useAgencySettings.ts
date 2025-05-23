
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
        .in('key', [
          'indian_states', 
          'agency_gst_details', 
          'tds_rates', 
          'billing_sequences', 
          'agency_name', 
          'agency_address', 
          'agency_email', 
          'agency_phone',
          'upi_address',
          'bank_details',
          'qr-code',
          'stamp',
          'signature',
          'icon_url',
          'contact_email',
          'contact_phone'
        ]);

      if (error) throw error;
      
      console.log('Agency settings data:', data); // Debug log to see what's coming from the database

      const settings = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);

      return {
        indianStates: settings.indian_states as string[],
        agencyGSTDetails: settings.agency_gst_details as AgencyGSTDetails,
        tdsRates: settings.tds_rates as TDSRate[],
        billingSequences: settings.billing_sequences,
        agencyDetails: {
          name: settings.agency_name || 'Your Agency',
          address: settings.agency_address || 'Agency Address',
          email: settings.contact_email || settings.agency_email || '',
          phone: settings.contact_phone || settings.agency_phone || '',
          iconUrl: settings.icon_url || '',
        },
        footerDetails: {
          upiAddress: settings.upi_address || '',
          bankDetails: settings.bank_details || '',
          qrCode: settings['qr-code'] || '', // Fix: Using the correct key 'qr-code' with bracket notation
          stamp: settings.stamp || '',
          signature: settings.signature || ''
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
