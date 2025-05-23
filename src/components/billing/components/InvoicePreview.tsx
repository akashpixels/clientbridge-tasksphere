
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { BillingFormData, LineItem } from "../types";
import { calculateGST, calculateTDS, calculateLineItemTotal } from "../utils/gstCalculations";
import { useAgencySettings, useClientDetails } from "../hooks/useAgencySettings";

interface InvoicePreviewProps {
  formData: BillingFormData;
  onFormChange: (data: Partial<BillingFormData>) => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ formData, onFormChange }) => {
  const { data: settings, isLoading: isLoadingSettings } = useAgencySettings();
  const { data: clientDetails, isLoading: isLoadingClient } = useClientDetails(formData.client_id);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const gstDetails = calculateGST(
    formData.items,
    formData.place_of_supply,
    settings?.agencyGSTDetails?.state || 'Maharashtra'
  );

  const tdsAmount = calculateTDS(gstDetails.total_amount, formData.tds_rate);
  const finalAmount = gstDetails.total_amount - tdsAmount;

  const addNewItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      gst_rate: 18,
      gst_amount: 0,
      total_amount: 0,
    };
    onFormChange({ items: [...formData.items, newItem] });
    setEditingItem(newItem.id);
  };

  const updateItem = (itemId: string, updates: Partial<LineItem>) => {
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
    const updatedItems = formData.items.filter(item => item.id !== itemId);
    onFormChange({ items: updatedItems });
  };

  const isIntraState = formData.place_of_supply === settings?.agencyGSTDetails?.state;
  const isInternational = formData.place_of_supply === 'International';

  // Custom input style to hide number spinners/arrows
  const numberInputStyle = "appearance-none";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Invoice Preview
            <Button onClick={addNewItem} size="sm" variant="outline">
              <Plus size={16} className="mr-1" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">From:</h3>
              <div className="text-sm space-y-1">
                {isLoadingSettings ? (
                  <p className="text-gray-400">Loading agency details...</p>
                ) : (
                  <>
                    <p className="font-medium">{settings?.agencyDetails?.name || 'Your Agency'}</p>
                    <p>{settings?.agencyDetails?.address || 'Agency Address'}</p>
                    {settings?.agencyGSTDetails?.gstin && (
                      <p>GSTIN: {settings.agencyGSTDetails.gstin}</p>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">To:</h3>
              <div className="text-sm space-y-1">
                {isLoadingClient || !formData.client_id ? (
                  <p className="text-gray-400">{formData.client_id ? 'Loading client details...' : 'Select a client'}</p>
                ) : (
                  <>
                    <p className="font-medium">{clientDetails?.business_name || 'Client Business Name'}</p>
                    <p>{clientDetails?.address || 'Client Address'}</p>
                    {clientDetails?.gstin && (
                      <p>GSTIN: {clientDetails.gstin}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Place of Supply */}
          <div className="text-sm">
            <span className="font-medium">Place of Supply: </span>
            {formData.place_of_supply || 'Not selected'}
          </div>

          {/* Line Items */}
          <div>
            <h3 className="font-semibold mb-3">Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-24">Rate</TableHead>
                  <TableHead className="w-20">GST %</TableHead>
                  <TableHead className="w-24">Amount</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {editingItem === item.id ? (
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          onBlur={() => setEditingItem(null)}
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => setEditingItem(item.id)}
                          className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          {item.description || 'Click to edit'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                        className={`w-full ${numberInputStyle}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                        className={`w-full ${numberInputStyle}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.gst_rate}
                        onChange={(e) => updateItem(item.id, { gst_rate: parseFloat(e.target.value) || 0 })}
                        className={`w-full ${numberInputStyle}`}
                        disabled={isInternational}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{item.total_amount.toFixed(2)}
                    </TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* GST Summary */}
          {!isInternational && gstDetails.total_gst > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">GST Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Taxable Amount:</span>
                  <span>₹{gstDetails.taxable_amount.toFixed(2)}</span>
                </div>
                {isIntraState ? (
                  <>
                    <div className="flex justify-between">
                      <span>CGST:</span>
                      <span>₹{gstDetails.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST:</span>
                      <span>₹{gstDetails.sgst.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span>IGST:</span>
                    <span>₹{gstDetails.igst.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Total GST:</span>
                  <span>₹{gstDetails.total_gst.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

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

          {/* Footer Section */}
          <div className="border-t pt-6 mt-8">
            <div className="space-y-4">
              {/* Notes */}
              <div className="text-sm">
                <h4 className="font-medium mb-2">Notes:</h4>
                <p className="text-gray-700">
                  {formData.notes || "Payment must be cleared within due date"}
                </p>
              </div>

              {/* Payment Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Information */}
                <div className="space-y-4">
                  {/* UPI Address */}
                  {settings?.footerDetails?.upiAddress && (
                    <div className="text-sm">
                      <h4 className="font-medium mb-1">UPI Address:</h4>
                      <p className="text-gray-700">{settings.footerDetails.upiAddress}</p>
                    </div>
                  )}

                  {/* Bank Details */}
                  {settings?.footerDetails?.bankDetails && (
                    <div className="text-sm">
                      <h4 className="font-medium mb-1">Bank Details:</h4>
                      <div className="text-gray-700 whitespace-pre-line">
                        {settings.footerDetails.bankDetails}
                      </div>
                    </div>
                  )}
                </div>

                {/* QR Code and Images */}
                <div className="space-y-4">
                  {/* QR Code */}
                  {settings?.footerDetails?.qrCode && (
                    <div className="text-center">
                      <h4 className="font-medium mb-2 text-sm">Scan to Pay</h4>
                      <img 
                        src={settings.footerDetails.qrCode} 
                        alt="QR Code" 
                        className="w-32 h-32 mx-auto border rounded"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Stamp and Signature */}
              <div className="flex justify-between items-end pt-4">
                {/* Stamp */}
                {settings?.footerDetails?.stamp && (
                  <div className="text-center">
                    <img 
                      src={settings.footerDetails.stamp} 
                      alt="Company Stamp" 
                      className="w-20 h-20 mx-auto"
                    />
                    <p className="text-xs text-gray-600 mt-1">Company Stamp</p>
                  </div>
                )}

                {/* Signature */}
                {settings?.footerDetails?.signature && (
                  <div className="text-center">
                    <img 
                      src={settings.footerDetails.signature} 
                      alt="Authorized Signature" 
                      className="w-32 h-16 mx-auto"
                    />
                    <p className="text-xs text-gray-600 mt-1">Authorized Signature</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
