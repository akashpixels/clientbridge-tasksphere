
import React, { useEffect } from 'react';
import { useLayout } from '@/context/layout';
import { BillingFormData } from '../types';
import { useCreateBilling } from '../hooks/useBillingData';
import { BillingSidebar } from './BillingSidebar';
import { calculateGST, calculateTDS } from '../utils/gstCalculations';
import { useAgencySettings, useClientAdmins } from '../hooks/useAgencySettings';

export const BillingCreationSidebar = () => {
  const { closeRightSidebar, billingFormData, updateBillingFormData } = useLayout();
  
  const { data: settings } = useAgencySettings();
  const { data: clients } = useClientAdmins();
  const createBilling = useCreateBilling();

  const formData = billingFormData || {
    billing_type: '',
    client_id: '',
    place_of_supply: '',
    tds_rate: 0,
    items: [],
    notes: '',
  };

  const handleSave = async () => {
    const selectedClient = clients?.find(client => client.id === formData.client_id);
    
    if (!selectedClient || !settings) {
      return;
    }

    const gstDetails = calculateGST(
      formData.items,
      formData.place_of_supply,
      settings.agencyGSTDetails?.state || 'Maharashtra'
    );

    const tdsAmount = calculateTDS(gstDetails.total_amount, formData.tds_rate);
    const finalAmount = gstDetails.total_amount - tdsAmount;

    const billingData = {
      billing_type: formData.billing_type as any,
      client_id: formData.client_id,
      place_of_supply: formData.place_of_supply,
      items: formData.items as any,
      amount_total: gstDetails.total_amount,
      amount_due: finalAmount,
      amount_payable: finalAmount,
      tds_rate: formData.tds_rate,
      tds_amount: tdsAmount,
      gst_details: gstDetails as any,
      agency_gstin: settings.agencyGSTDetails?.gstin || '',
      client_gstin: selectedClient.gstin || '',
      snapshot_data: {
        client: selectedClient,
        agency: settings.agencyGSTDetails,
        items: formData.items,
        gst_details: gstDetails,
        tds_details: {
          rate: formData.tds_rate,
          amount: tdsAmount,
        },
        place_of_supply: formData.place_of_supply,
        notes: formData.notes,
        created_at: new Date().toISOString(),
      } as any,
    };

    try {
      await createBilling.mutateAsync(billingData);
      closeRightSidebar();
    } catch (error) {
      console.error('Failed to create billing:', error);
    }
  };

  return (
    <BillingSidebar
      isOpen={true}
      onClose={closeRightSidebar}
      formData={formData}
      onFormChange={updateBillingFormData}
      onSave={handleSave}
      isLoading={createBilling.isPending}
    />
  );
};
