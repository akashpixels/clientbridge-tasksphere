
import React from 'react';
import { InvoicePreview } from './InvoicePreview';
import { useLayout } from '@/context/layout';

export const BillingCreationPage: React.FC = () => {
  const { billingFormData, updateBillingFormData } = useLayout();

  if (!billingFormData) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Loading billing form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <InvoicePreview 
        formData={billingFormData} 
        onFormChange={updateBillingFormData} 
      />
    </div>
  );
};
