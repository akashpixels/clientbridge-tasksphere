
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentPercentageSelector } from './PaymentPercentageSelector';
import { PaymentMethodTabs } from './PaymentMethodTabs';
import { calculatePaymentAmount } from '../utils/paymentCalculations';

interface PaymentBlockProps {
  totalAmount: number;
  billingId: string;
  remainingAmount?: number;
  onPaymentSubmit: (paymentData: any) => void;
}

export const PaymentBlock: React.FC<PaymentBlockProps> = ({
  totalAmount,
  billingId,
  remainingAmount = totalAmount,
  onPaymentSubmit
}) => {
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [paymentPercentage, setPaymentPercentage] = useState(100);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'bank' | 'online'>('upi');

  const paymentCalculation = calculatePaymentAmount(remainingAmount, paymentPercentage);

  const handlePaymentTypeChange = (type: 'full' | 'partial') => {
    setPaymentType(type);
    if (type === 'full') {
      setPaymentPercentage(100);
    } else {
      setPaymentPercentage(50);
    }
  };

  const handlePaymentSubmit = (proofData?: any) => {
    const paymentData = {
      billing_id: billingId,
      payment_method: selectedMethod,
      payment_type: paymentType,
      payment_percentage: paymentPercentage,
      amount: paymentCalculation.baseAmount,
      discount_amount: paymentCalculation.discountAmount,
      final_amount: paymentCalculation.finalAmount,
      ...proofData
    };
    onPaymentSubmit(paymentData);
  };

  return (
    <Card className="mt-6 border-2 border-blue-100 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💳 Payment Options
          {paymentCalculation.discountAmount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Save ₹{paymentCalculation.discountAmount.toFixed(2)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Type Selection */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Choose Payment Option</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={paymentType === 'full' ? 'default' : 'outline'}
              onClick={() => handlePaymentTypeChange('full')}
              className="relative h-auto p-4 flex flex-col items-start"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Pay in Full</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  5% OFF
                </Badge>
              </div>
              <span className="text-sm opacity-75">
                ₹{(remainingAmount * 0.95).toFixed(2)}
              </span>
            </Button>
            
            <Button
              variant={paymentType === 'partial' ? 'default' : 'outline'}
              onClick={() => handlePaymentTypeChange('partial')}
              className="h-auto p-4 flex flex-col items-start"
            >
              <span className="font-medium mb-1">Pay in Part</span>
              <span className="text-sm opacity-75">
                Choose percentage
              </span>
            </Button>
          </div>
        </div>

        {/* Payment Percentage Selector */}
        {paymentType === 'partial' && (
          <PaymentPercentageSelector
            percentage={paymentPercentage}
            onPercentageChange={setPaymentPercentage}
            baseAmount={remainingAmount}
          />
        )}

        {/* Payment Calculation Display */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base Amount ({paymentPercentage}%):</span>
              <span>₹{paymentCalculation.baseAmount.toFixed(2)}</span>
            </div>
            {paymentCalculation.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount (5%):</span>
                <span>-₹{paymentCalculation.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Final Amount:</span>
              <span>₹{paymentCalculation.finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Tabs */}
        <PaymentMethodTabs
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
          paymentAmount={paymentCalculation.finalAmount}
          onPaymentSubmit={handlePaymentSubmit}
        />
      </CardContent>
    </Card>
  );
};
