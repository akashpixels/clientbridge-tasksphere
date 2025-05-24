
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBillingData } from "../hooks/useBillingData";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLayout } from "@/context/layout";
import { useNavigate } from "react-router-dom";
import { BillingCreationSidebar } from "./BillingCreationSidebar";
import { BillingFormData } from "../types";

export const BillingListPage = () => {
  const { data: billingData, isLoading } = useBillingData();
  const [filterType, setFilterType] = useState<string>('all');
  const { setRightSidebarContent, setBillingCreationActive } = useLayout();
  const navigate = useNavigate();

  const filteredData = billingData?.filter(item => 
    filterType === 'all' || item.billing_type === filterType
  );

  const handleCreateNew = () => {
    const initialFormData: BillingFormData = {
      billing_type: undefined,
      client_id: '',
      place_of_supply: '',
      tds_rate: 0,
      items: [],
      notes: '',
    };

    setBillingCreationActive(true, initialFormData);
    setRightSidebarContent(<BillingCreationSidebar />);
  };

  const handleBillingClick = (billingId: string) => {
    navigate(`/billing/${billingId}`);
  };

  const handleCopyUrl = (billingId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation when clicking copy button
    const url = `${window.location.origin}/billing/share/${billingId}`;
    navigator.clipboard.writeText(url);
    toast.success('Billing URL copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBillingTypeColor = (type: string) => {
    switch (type) {
      case 'invoice': return 'bg-blue-100 text-blue-800';
      case 'estimate': return 'bg-purple-100 text-purple-800';
      case 'credit_note': return 'bg-green-100 text-green-800';
      case 'debit_note': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading billing data...</div>;
  }

  return (
    <div className="space-y-6  p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Billing</h1>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus size={16} />
          Create New Billing
        </Button>
      </div>

     <div className="space-y-6  p-6 container mx-auto ">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Billing Records</CardTitle>
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="estimate">Estimate</SelectItem>
                  <SelectItem value="credit_note">Credit Note</SelectItem>
                  <SelectItem value="debit_note">Debit Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredData?.map((billing) => (
              <div
                key={billing.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleBillingClick(billing.id)}
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{billing.billing_number}</span>
                      <Badge className={getBillingTypeColor(billing.billing_type)}>
                        {billing.billing_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {billing.client_admins?.business_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {billing.created_at ? format(new Date(billing.created_at), 'MMM dd, yyyy') : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold">₹{billing.amount_total?.toLocaleString()}</p>
                    <Badge className={getStatusColor(billing.payment_status)}>
                      {billing.payment_status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleCopyUrl(billing.id, e)}
                    className="flex items-center gap-1"
                  >
                    <Copy size={14} />
                    Copy URL
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredData?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No billing records found
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </div>
  );
};
