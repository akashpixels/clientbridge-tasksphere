
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { BillingFormData, LineItem } from "../types";
import { calculateGST, calculateTDS, calculateLineItemTotal } from "../utils/gstCalculations";
import { useAgencySettings, useClientDetails } from "../hooks/useAgencySettings";
import { InvoiceHeader } from './InvoiceHeader';
import { InvoiceInfoColumns } from './InvoiceInfoColumns';
import { InvoiceFooter } from './InvoiceFooter';
import { PaymentBlock } from './PaymentBlock';
import { useCreatePaymentTransaction } from '../hooks/usePaymentTransactions';

interface InvoicePreviewProps {
  formData: BillingFormData;
  onFormChange: (data: Partial<BillingFormData>) => void;
  readOnly?: boolean;
  billingId?: string;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ 
  formData, 
  onFormChange, 
  readOnly = false,
  billingId 
}) => {
  const { data: settings, isLoading: isLoadingSettings } = useAgencySettings();
  const { data: clientDetails, isLoading: isLoadingClient } = useClientDetails(formData.client_id);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const createPaymentTransaction = useCreatePaymentTransaction();

  // Debug log to see what settings are available
  console.log('Agency settings in InvoicePreview:', settings?.footerDetails);

  const sacCodes = [
    { value: '998314', label: '998314' },
    { value: '998313', label: '998313' },
    { value: '998319', label: '998319' },
    { value: '998315', label: '998315' },
  ];

  const gstDetails = calculateGST(
    formData.items,
    formData.place_of_supply,
    settings?.agencyGSTDetails?.state || 'Maharashtra'
  );

  const tdsAmount = calculateTDS(gstDetails.total_amount, formData.tds_rate);
  const finalAmount = gstDetails.total_amount - tdsAmount;

  const addNewItem = () => {
    if (readOnly) return;
    
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      gst_rate: 18,
      gst_amount: 0,
      total_amount: 0,
      sac_code: '998314', // Default SAC code
    };
    onFormChange({ items: [...formData.items, newItem] });
    setEditingItem(newItem.id);
  };

  const updateItem = (itemId: string, updates: Partial<LineItem>) => {
    if (readOnly) return;
    
    const updatedItems = formData.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        return calculateLineItemTotal(updatedItem);
      }
      return item;
    });
    onFormChange({ items: updatedItems });
  };

  const removeItem = (itemId: string) => {
    if (readOnly) return;
    
    const updatedItems = formData.items.filter(item => item.id !== itemId);
    onFormChange({ items: updatedItems });
  };

  const handlePaymentSubmit = async (paymentData: any) => {
    if (!billingId) {
      console.error('Billing ID is required for payment submission');
      return;
    }

    try {
      await createPaymentTransaction.mutateAsync({
        ...paymentData,
        billing_id: billingId,
        transaction_type: 'receipt',
        transaction_status: 'pending',
        transaction_date: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Payment submission failed:', error);
    }
  };

  const isIntraState = formData.place_of_supply === settings?.agencyGSTDetails?.state;
  const isInternational = formData.place_of_supply === 'International';

  const getDocumentType = () => {
    switch (formData.billing_type) {
      case 'invoice': return 'Invoice';
      case 'estimate': return 'Estimate';
      case 'credit_note': return 'Credit Note';
      case 'debit_note': return 'Debit Note';
      default: return 'Document';
    }
  };

  // Show payment block for invoices, estimates, and debit notes in read-only mode with billing ID
  const showPaymentBlock = readOnly && 
                          billingId && 
                          ['invoice', 'estimate', 'debit_note'].includes(formData.billing_type) && 
                          finalAmount > 0;

  return (
    <div className="max-w-[794px] mx-auto bg-white p-16 shadow-sm rounded-lg space-y-6">
      {/* Header */}
      <InvoiceHeader 
        agencyLogo={settings?.agencyDetails?.iconUrl}
        documentType={getDocumentType()}
        documentNumber={formData.billing_number}
        agencyEmail={settings?.agencyDetails?.email}
        agencyPhone={settings?.agencyDetails?.phone}
        issueDate={new Date()}
      />

       {/* Place of Supply */}
      <div className="text-sm mb-6 text-end">
        <span className="font-medium">Place of Supply: </span>
        {formData.place_of_supply || 'Not selected'}
      </div>

      {/* Three-Column Info */}
      <InvoiceInfoColumns 
        agencyName={settings?.agencyDetails?.name}
        agencyAddress={settings?.agencyDetails?.address}
        agencyGSTIN={settings?.agencyGSTDetails?.gstin}
        clientName={clientDetails?.business_name}
        clientAddress={clientDetails?.address}
        clientGSTIN={clientDetails?.gstin}
        totalAmount={finalAmount}
        dueDate={formData.due_date}
      />

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Items</h3>
          {!readOnly && (
            <Button onClick={addNewItem} size="sm" variant="outline">
              <Plus size={16} className="mr-1" />
              Add Item
            </Button>
          )}
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="w-20">Qty</TableHead>
              <TableHead className="w-24">Rate</TableHead>
              <TableHead className="w-20">GST %</TableHead>
              <TableHead className="w-24">Amount</TableHead>
              {!readOnly && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {formData.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="space-y-1">
                    {editingItem === item.id && !readOnly ? (
                      <Input
                        variant="minimal"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        onBlur={() => setEditingItem(null)}
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={() => !readOnly && setEditingItem(item.id)}
                        className={readOnly ? "" : "cursor-pointer hover:bg-gray-50 p-1 rounded"}
                      >
                        {item.description || (readOnly ? '-' : 'Click to edit')}
                      </div>
                    )}
                    
                    {/* SAC Code Dropdown */}
                    <div className="text-xs">
                      {readOnly ? (
                        <span className="text-gray-500">SAC: {item.sac_code || '998314'}</span>
                      ) : (
                        <Select
                          value={item.sac_code || '998314'}
                          onValueChange={(value) => updateItem(item.id, { sac_code: value })}
                        >
                          <SelectTrigger className="h-6 text-xs border-gray-200">
                            <SelectValue placeholder="SAC Code" />
                          </SelectTrigger>
                          <SelectContent>
                            {sacCodes.map((code) => (
                              <SelectItem key={code.value} value={code.value} className="text-xs">
                                SAC: {code.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    <span>{item.quantity}</span>
                  ) : (
                    <Input
                      variant="minimal"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full text-center"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    <span>₹{item.rate.toFixed(2)}</span>
                  ) : (
                    <Input
                      variant="minimal"
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                      className="w-full text-right"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    <span>{item.gst_rate}%</span>
                  ) : (
                    <Input
                      variant="minimal"
                      type="number"
                      value={item.gst_rate}
                      onChange={(e) => updateItem(item.id, { gst_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full text-center"
                      disabled={isInternational}
                    />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  ₹{item.total_amount.toFixed(2)}
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Total Summary */}
      <div className="border-t pt-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{gstDetails.taxable_amount.toFixed(2)}</span>
          </div>
          {!isInternational && (
            <div className="flex justify-between">
              <span>GST:</span>
              <span>₹{gstDetails.total_gst.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total Amount:</span>
            <span>₹{gstDetails.total_amount.toFixed(2)}</span>
          </div>
          {formData.tds_rate > 0 && (
            <>
              <div className="flex justify-between text-red-600">
                <span>TDS ({formData.tds_rate}%):</span>
                <span>-₹{tdsAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Amount Payable:</span>
                <span>₹{finalAmount.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Block - Show for invoices, estimates, and debit notes in read-only mode */}
      {showPaymentBlock && (
        <div className="print:hidden">
          <PaymentBlock
            totalAmount={gstDetails.total_amount}
            billingId={billingId}
            remainingAmount={finalAmount}
            onPaymentSubmit={handlePaymentSubmit}
          />
        </div>
      )}

      {/* Footer */}
      <InvoiceFooter 
        notes={formData.notes}
        upiAddress={settings?.footerDetails?.upiAddress}
        bankDetails={settings?.footerDetails?.bankDetails}
        qrCode={settings?.footerDetails?.qrCode}
        signature={settings?.footerDetails?.signature}
        stamp={settings?.footerDetails?.stamp}
      />
    </div>
  );
};
