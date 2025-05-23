
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to fetch the next billing number for a specified billing type
 * 
 * @param billingType - The type of billing (invoice, estimate, credit_note, debit_note)
 * @returns The next billing number in the format XXX25-0001
 */
export const useNextBillingNumber = (billingType: string | null) => {
  const [billingNumber, setBillingNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!billingType) {
      setBillingNumber("");
      return;
    }

    const fetchNextBillingNumber = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Using the new database function to get the next billing number
        const { data, error } = await supabase.rpc('get_next_billing_number', { 
          billing_type_param: billingType
        });

        if (error) throw error;

        setBillingNumber(data || "");
      } catch (err: any) {
        console.error('Error fetching next billing number:', err);
        setError(err.message || 'Failed to fetch next billing number');
        
        // Generate a fallback number pattern
        const year = new Date().getFullYear().toString().slice(-2);
        let prefix = 'DOC';
        
        switch(billingType) {
          case 'invoice': prefix = 'INV'; break;
          case 'estimate': prefix = 'EST'; break;
          case 'credit_note': prefix = 'CRN'; break;
          case 'debit_note': prefix = 'DBN'; break;
        }
        
        setBillingNumber(`${prefix}${year}-0001`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNextBillingNumber();
  }, [billingType]);

  return { billingNumber, isLoading, error };
};
