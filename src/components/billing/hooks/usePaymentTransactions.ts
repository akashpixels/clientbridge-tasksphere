
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePaymentTransactions = (billingId: string) => {
  return useQuery({
    queryKey: ['payment-transactions', billingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('billing_id', billingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreatePaymentTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transactionData: any) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      
      toast({
        title: "Payment Submitted",
        description: "Your payment has been submitted for verification.",
      });
    },
    onError: (error) => {
      console.error('Payment submission error:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to submit payment. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePaymentVerification = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      transactionId, 
      verification_status, 
      verification_notes 
    }: {
      transactionId: string;
      verification_status: 'verified' | 'rejected';
      verification_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          verification_status,
          verification_notes,
          verified_at: new Date().toISOString(),
          // verified_by would be set from auth context in a real app
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      
      toast({
        title: "Payment Updated",
        description: "Payment verification status has been updated.",
      });
    },
  });
};
