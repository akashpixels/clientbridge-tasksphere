
import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useBillingById } from '@/components/billing/hooks/useBillingData';
import { InvoicePreview } from '@/components/billing/components/InvoicePreview';
import { BillingFormData } from '@/components/billing/types';

const BillingShare: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: billing, isLoading, error } = useBillingById(id || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading billing details...</p>
        </div>
      </div>
    );
  }

  if (error || !billing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Billing Not Found</h2>
          <p className="text-gray-600">The billing record you're looking for doesn't exist or may have been removed.</p>
        </div>
      </div>
    );
  }

  // Safely parse snapshot_data
  const snapshotData = billing.snapshot_data as any;

  // Convert billing data to form data format for InvoicePreview
  const formData: BillingFormData = {
    billing_type: billing.billing_type,
    client_id: billing.client_id,
    place_of_supply: billing.place_of_supply || '',
    tds_rate: Number(billing.tds_rate) || 0,
    items: billing.items as any[] || [],
    notes: snapshotData?.notes || '',
    due_date: snapshotData?.due_date ? new Date(snapshotData.due_date) : undefined,
    billing_number: billing.billing_number || '',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{billing.billing_number}</h1>
            <p className="text-gray-600">
              {billing.client_admins?.business_name}
            </p>
          </div>
          <Button onClick={handlePrint} variant="outline">
            <Printer size={16} className="mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="p-3 print:p-0">
        <div className="print-content">
          <InvoicePreview 
            formData={formData}
            onFormChange={() => {}} // Read-only mode
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
};

export default BillingShare;
