
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpiPaymentSection } from './UpiPaymentSection';
import { BankPaymentSection } from './BankPaymentSection';
import { OnlinePaymentSection } from './OnlinePaymentSection';

interface PaymentMethodTabsProps {
  selectedMethod: 'upi' | 'bank' | 'online';
  onMethodChange: (method: 'upi' | 'bank' | 'online') => void;
  paymentAmount: number;
  onPaymentSubmit: (proofData?: any) => void;
}

export const PaymentMethodTabs: React.FC<PaymentMethodTabsProps> = ({
  selectedMethod,
  onMethodChange,
  paymentAmount,
  onPaymentSubmit
}) => {
  return (
    <Tabs value={selectedMethod} onValueChange={(value) => onMethodChange(value as any)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="upi">UPI</TabsTrigger>
        <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
        <TabsTrigger value="online" disabled>Online (Soon)</TabsTrigger>
      </TabsList>
      
      <TabsContent value="upi" className="mt-4">
        <UpiPaymentSection
          paymentAmount={paymentAmount}
          onPaymentSubmit={onPaymentSubmit}
        />
      </TabsContent>
      
      <TabsContent value="bank" className="mt-4">
        <BankPaymentSection
          paymentAmount={paymentAmount}
          onPaymentSubmit={onPaymentSubmit}
        />
      </TabsContent>
      
      <TabsContent value="online" className="mt-4">
        <OnlinePaymentSection
          paymentAmount={paymentAmount}
          onPaymentSubmit={onPaymentSubmit}
        />
      </TabsContent>
    </Tabs>
  );
};
