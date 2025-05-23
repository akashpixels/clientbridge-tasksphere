import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BillingInsert, BillingRow, GSTDetails } from "../types";
import { toast } from "sonner";

export const useBillingData = () => {
  return useQuery({
    queryKey: ['billing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing')
        .select(`
          *,
          client_admins (
            business_name,
            address,
            gstin
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useBillingById = (id: string) => {
  return useQuery({
    queryKey: ['billing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing')
        .select(`
          *,
          client_admins (
            business_name,
            address,
            gstin
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateBilling = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (billingData: BillingInsert) => {
      // Ensure gst_details is properly serialized as JSON
      const processedData = {
        ...billingData,
        gst_details: billingData.gst_details as any, // Cast to satisfy TypeScript
      };

      const { data, error } = await supabase
        .from('billing')
        .insert(processedData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      toast.success('Billing record created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create billing record: ' + error.message);
    },
  });
};

export const useUpdateBilling = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BillingRow> }) => {
      const { data, error } = await supabase
        .from('billing')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      toast.success('Billing record updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update billing record: ' + error.message);
    },
  });
};
