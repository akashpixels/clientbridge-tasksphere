
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useAgencySettings, useClientAdmins } from "../hooks/useAgencySettings";
import { BillingFormData } from "../types";
import { detectStateFromAddress } from "../utils/gstCalculations";

interface BillingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  formData: BillingFormData;
  onFormChange: (data: Partial<BillingFormData>) => void;
  onSave: () => void;
  isLoading?: boolean;
}

export const BillingSidebar: React.FC<BillingSidebarProps> = ({
  isOpen,
  onClose,
  formData,
  onFormChange,
  onSave,
  isLoading = false,
}) => {
  const { data: settings } = useAgencySettings();
  const { data: clients } = useClientAdmins();

  const selectedClient = clients?.find(client => client.id === formData.client_id);

  useEffect(() => {
    if (selectedClient && settings?.indianStates) {
      const detectedState = detectStateFromAddress(selectedClient.address || '', settings.indianStates);
      if (detectedState && detectedState !== formData.place_of_supply) {
        onFormChange({ place_of_supply: detectedState });
      }
    }
  }, [selectedClient, settings?.indianStates, formData.place_of_supply, onFormChange]);

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center px-4 border-b sticky top-0 z-20 py-2 bg-background">
        <h2 className="text-sm text-gray-500">Billing Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>
      
      <form className="space-y-4 flex-1 overflow-y-auto">
        <div className="h-full w-full rounded-[inherit] hide-scrollbar">
          <div className="space-y-5 p-4">
            {/* Billing Type */}
            <div className="space-y-2">
              <Label htmlFor="billing_type">Billing Type</Label>
              <Select
                value={formData.billing_type}
                onValueChange={(value) => onFormChange({ billing_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select billing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="estimate">Estimate</SelectItem>
                  <SelectItem value="credit_note">Credit Note</SelectItem>
                  <SelectItem value="debit_note">Debit Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => onFormChange({ client_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Details Display */}
            {selectedClient && (
              <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                <p className="text-sm font-medium">{selectedClient.business_name}</p>
                <p className="text-xs text-gray-600">{selectedClient.address}</p>
                {selectedClient.gstin && (
                  <p className="text-xs text-gray-600">GSTIN: {selectedClient.gstin}</p>
                )}
              </div>
            )}

            {/* Place of Supply */}
            <div className="space-y-2">
              <Label htmlFor="place_of_supply">Place of Supply</Label>
              <Select
                value={formData.place_of_supply}
                onValueChange={(value) => onFormChange({ place_of_supply: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="International">International</SelectItem>
                  {settings?.indianStates?.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* TDS Rate */}
            <div className="space-y-2">
              <Label htmlFor="tds_rate">TDS Rate</Label>
              <Select
                value={formData.tds_rate.toString()}
                onValueChange={(value) => onFormChange({ tds_rate: parseFloat(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select TDS rate" />
                </SelectTrigger>
                <SelectContent>
                  {settings?.tdsRates?.map((rate) => (
                    <SelectItem key={rate.value} value={rate.value.toString()}>
                      {rate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => onFormChange({ notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="border-t p-4 bg-background sticky bottom-0 z-10">
          <Button 
            onClick={onSave} 
            className="w-full"
            disabled={isLoading || !formData.billing_type || !formData.client_id}
          >
            {isLoading ? 'Saving...' : 'Save Billing'}
          </Button>
        </div>
      </form>
    </div>
  );
};
