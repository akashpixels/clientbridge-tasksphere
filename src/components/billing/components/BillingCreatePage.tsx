
import React, { useState } from 'react';
import { BillingSidebar } from './BillingSidebar';
import { InvoicePreview } from './InvoicePreview';
import { BillingFormData, LineItem } from '../types';
import { useCreateBilling } from '../hooks/useBillingData';
import { useAgencySettings, useClientAdmins } from '../hooks/useAgencySettings';
import { calculateGST, calculateTDS } from '../utils/gstCalculations';

interface BillingCreatePageProps {
  onClose: () => void;
}

export const BillingCreatePage: React.FC<BillingCreatePageProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<BillingFormData>({
    billing_type: '',
    client_id: '',
    place_of_supply: '',
    tds_rate: 0,
    items: [],
    notes: '',
  });

  const { data: settings } = useAgencySettings();
  const { data: clients } = useClientAdmins();
  const createBilling = useCreateBilling();

  const handleFormChange = (updates: Partial<BillingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
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
      items: formData.items,
      amount_total: gstDetails.total_amount,
      amount_due: finalAmount,
      amount_payable: finalAmount,
      tds_rate: formData.tds_rate,
      tds_amount: tdsAmount,
      gst_details: gstDetails,
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
      },
    };

    try {
      await createBilling.mutateAsync(billingData);
      onClose();
    } catch (error) {
      console.error('Failed to create billing:', error);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-y-auto p-6">
        <InvoicePreview formData={formData} onFormChange={handleFormChange} />
      </div>
      
      <BillingSidebar
        isOpen={true}
        onClose={onClose}
        formData={formData}
        onFormChange={handleFormChange}
        onSave={handleSave}
        isLoading={createBilling.isPending}
      />
    </div>
  );
};
