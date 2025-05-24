
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Clock } from "lucide-react";

interface OnlinePaymentSectionProps {
  paymentAmount: number;
  onPaymentSubmit: (proofData: any) => void;
}

export const OnlinePaymentSection: React.FC<OnlinePaymentSectionProps> = ({
  paymentAmount,
  onPaymentSubmit
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard size={20} />
          Online Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex justify-center">
          <Clock size={48} className="text-gray-400" />
        </div>
        
        <div>
          <h3 className="font-semibold text-lg mb-2">Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            Online payment integration with Razorpay is under development.
            Please use UPI or Bank Transfer for now.
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-center">
            <span className="text-sm text-gray-600">Payment Amount: </span>
            <span className="text-xl font-bold text-blue-600">
              ₹{paymentAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <Button disabled className="w-full">
          Online Payment (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  );
};
