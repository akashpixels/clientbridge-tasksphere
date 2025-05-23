
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useAgencySettings, useClientAdmins } from "../hooks/useAgencySettings";
import { BillingFormData, BillingType } from "../types";
import { detectStateFromAddress } from "../utils/gstCalculations";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useNextBillingNumber } from "../hooks/useNextBillingNumber";

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
  
  // Only pass billing_type if it's a valid BillingType, otherwise pass null
  const billingTypeForHook = formData.billing_type && 
    ['estimate', 'invoice', 'credit_note', 'debit_note'].includes(formData.billing_type)
    ? formData.billing_type as BillingType 
    : null;
  
  const { billingNumber } = useNextBillingNumber(billingTypeForHook);

  const selectedClient = clients?.find(client => client.id === formData.client_id);

  // Set default due date (7 days from now) if not already set
  useEffect(() => {
    if (!formData.due_date) {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      onFormChange({ due_date: defaultDueDate });
    }
  }, [formData.due_date, onFormChange]);

  useEffect(() => {
    if (selectedClient && settings?.indianStates) {
      const detectedState = detectStateFromAddress(selectedClient.address || '', settings.indianStates);
      if (detectedState && detectedState !== formData.place_of_supply) {
        onFormChange({ place_of_supply: detectedState });
      }
    }
  }, [selectedClient, settings?.indianStates, formData.place_of_supply, onFormChange]);

  // Set default notes if not already set
  useEffect(() => {
    if (!formData.notes) {
      onFormChange({ notes: "Payment must be cleared within due date" });
    }
  }, [formData.notes, onFormChange]);

  // Update billing number whenever it changes
  useEffect(() => {
    if (billingNumber && billingNumber !== formData.billing_number) {
      onFormChange({ billing_number: billingNumber });
    }
  }, [billingNumber, formData.billing_number, onFormChange]);

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
                value={formData.billing_type || ''}
                onValueChange={(value) => onFormChange({ billing_type: value as BillingType })}
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

            {/* Billing Number Display */}
            {formData.billing_type && billingNumber && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">
                  {formData.billing_type.charAt(0).toUpperCase() + formData.billing_type.slice(1)} Number: {billingNumber}
                </p>
              </div>
            )}

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

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="due_date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? (
                      format(new Date(formData.due_date), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date ? new Date(formData.due_date) : undefined}
                    onSelect={(date) => onFormChange({ due_date: date || undefined })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => onFormChange({ notes: e.target.value })}
                placeholder="Payment must be cleared within due date"
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
