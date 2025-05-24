
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useBillingById } from '@/components/billing/hooks/useBillingData';
import { InvoicePreview } from '@/components/billing/components/InvoicePreview';
import { BillingFormData } from '@/components/billing/types';

const BillingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: billing, isLoading, error } = useBillingById(id || '');

  if (isLoading) {
    return <div className="p-6">Loading billing details...</div>;
  }

  if (error || !billing) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Billing Not Found</h2>
          <p className="text-gray-600 mb-6">The billing record you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/billing')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Billing
          </Button>
        </div>
      </div>
    );
  }

  // Convert billing data to form data format for InvoicePreview
  const formData: BillingFormData = {
    billing_type: billing.billing_type,
    client_id: billing.client_id,
    place_of_supply: billing.place_of_supply || '',
    tds_rate: Number(billing.tds_rate) || 0,
    items: billing.items as any[] || [],
    notes: billing.snapshot_data?.notes || '',
    due_date: billing.snapshot_data?.due_date ? new Date(billing.snapshot_data.due_date) : undefined,
    billing_number: billing.billing_number || '',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/billing')}>
              <ArrowLeft size={16} className="mr-2" />
              Back to Billing
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{billing.billing_number}</h1>
              <p className="text-gray-600">
                {billing.client_admins?.business_name}
              </p>
            </div>
          </div>
          <Button onClick={handlePrint} variant="outline">
            <Printer size={16} className="mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="p-6">
        <InvoicePreview 
          formData={formData}
          onFormChange={() => {}} // Read-only mode
          readOnly={true}
        />
      </div>
    </div>
  );
};

export default BillingDetails;
