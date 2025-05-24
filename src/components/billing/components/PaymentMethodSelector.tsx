
import React from 'react';
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone } from "lucide-react";

interface PaymentMethodSelectorProps {
  selectedMethod: 'upi' | 'bank' | 'card';
  onMethodChange: (method: 'upi' | 'bank' | 'card') => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange
}) => {
  const paymentMethods = [
    {
      id: 'upi',
      label: 'UPI',
      icon: Smartphone,
      description: 'Pay with UPI apps',
      disabled: false
    },
    {
      id: 'bank',
      label: 'Bank Transfer',
      icon: CreditCard,
      description: 'Direct bank transfer',
      disabled: false
    },
    {
      id: 'card',
      label: 'Card Payment',
      icon: CreditCard,
      description: 'Coming soon',
      disabled: true
    }
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700">Payment Method</h4>
      <RadioGroup value={selectedMethod} onValueChange={onMethodChange}>
        <div className="grid gap-3">
          {paymentMethods.map((method) => (
            <div key={method.id}>
              <Label htmlFor={method.id} className="cursor-pointer">
                <Card className={`relative p-4 border-2 transition-all hover:border-blue-200 ${
                  selectedMethod === method.id 
                    ? 'border-blue-500 bg-blue-50/50' 
                    : 'border-gray-200'
                } ${method.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value={method.id} 
                      id={method.id}
                      disabled={method.disabled}
                      className="mt-0.5"
                    />
                    <method.icon className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{method.label}</div>
                      <div className="text-xs text-gray-500">{method.description}</div>
                    </div>
                  </div>
                </Card>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};
