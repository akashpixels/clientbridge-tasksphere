
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PaymentPercentageDropdown } from './PaymentPercentageDropdown';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PaymentDetailsModal } from './PaymentDetailsModal';
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
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'bank' | 'card'>('upi');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const paymentCalculation = calculatePaymentAmount(remainingAmount, paymentPercentage);

  const handlePaymentTypeChange = (type: 'full' | 'partial') => {
    setPaymentType(type);
    if (type === 'full') {
      setPaymentPercentage(100);
    } else {
      setPaymentPercentage(50);
    }
  };

  const handlePayNow = () => {
    setShowPaymentModal(true);
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
    setShowPaymentModal(false);
  };

  return (
    <>
      <Card className="border-2 border-blue-100 bg-white shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            💳 Payment Options
            {paymentCalculation.discountAmount > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                Save ₹{paymentCalculation.discountAmount.toFixed(2)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Type Selection with Radio Buttons */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Choose Payment Option</h4>
            <RadioGroup 
              value={paymentType} 
              onValueChange={(value: 'full' | 'partial') => handlePaymentTypeChange(value)}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Pay in Full</div>
                        <div className="text-sm text-gray-500">
                          ₹{(remainingAmount * 0.95).toFixed(2)}
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        5% OFF
                      </Badge>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="partial" id="partial" />
                  <Label htmlFor="partial" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-medium">Pay in Part</div>
                      <div className="text-sm text-gray-500">Choose percentage</div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Percentage Dropdown */}
          {paymentType === 'partial' && (
            <PaymentPercentageDropdown
              percentage={paymentPercentage}
              onPercentageChange={setPaymentPercentage}
              baseAmount={remainingAmount}
            />
          )}

          {/* Payment Calculation Display */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
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
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onMethodChange={setSelectedMethod}
          />

          {/* Pay Now Button */}
          <Button 
            onClick={handlePayNow} 
            className="w-full"
            disabled={selectedMethod === 'card'}
          >
            Pay Now
          </Button>
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentMethod={selectedMethod}
        paymentAmount={paymentCalculation.finalAmount}
        onPaymentSubmit={handlePaymentSubmit}
      />
    </>
  );
};
