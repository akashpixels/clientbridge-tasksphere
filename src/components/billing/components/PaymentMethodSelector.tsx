import React from 'react';
import { Card } from "@/components/ui/card";
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
      disabled: false
    },
    {
      id: 'bank',
      label: 'Bank',
      icon: CreditCard,
      disabled: false
    },
    {
      id: 'card',
      label: 'Card',
      icon: CreditCard,
      disabled: true
    }
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700">Payment Method</h4>
      <div className="flex gap-4">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            disabled={method.disabled}
            onClick={() => !method.disabled && onMethodChange(method.id as any)}
            className={`w-28 p-3 flex flex-col items-center rounded-lg border-2 transition-all
              ${selectedMethod === method.id ? "border-blue-500 bg-blue-50/50" : "border-gray-200"}
              ${method.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              focus:outline-none focus:ring-2 focus:ring-blue-300`}
          >
            <method.icon className="h-6 w-6 text-gray-700 mb-1" />
            <div className="font-medium text-sm">{method.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
