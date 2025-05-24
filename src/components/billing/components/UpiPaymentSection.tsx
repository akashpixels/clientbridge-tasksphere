
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, QrCode } from "lucide-react";
import { useAgencySettings } from '../hooks/useAgencySettings';
import { PaymentProofUpload } from './PaymentProofUpload';
import { useToast } from "@/hooks/use-toast";

interface UpiPaymentSectionProps {
  paymentAmount: number;
  onPaymentSubmit: (proofData: any) => void;
}

export const UpiPaymentSection: React.FC<UpiPaymentSectionProps> = ({
  paymentAmount,
  onPaymentSubmit
}) => {
  const [uploadedProof, setUploadedProof] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: settings } = useAgencySettings();
  const { toast } = useToast();

  const upiAddress = settings?.footerDetails?.upiAddress;
  const qrCode = settings?.footerDetails?.qrCode;

  const handleProofUpload = (fileUrl: string) => {
    setUploadedProof(fileUrl);
  };

  const handleSubmitPayment = async () => {
    if (!uploadedProof) {
      toast({
        title: "Payment Proof Required",
        description: "Please upload a screenshot of your payment as proof.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onPaymentSubmit({
        transaction_proof_url: uploadedProof,
        verification_status: 'pending'
      });
      
      toast({
        title: "Payment Submitted",
        description: "Your payment has been submitted for verification. You'll be notified once verified.",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode size={20} />
            UPI Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* UPI Address */}
          {upiAddress && (
            <div>
              <Label>UPI Address</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={upiAddress}
                  readOnly
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(upiAddress)}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}

          {/* QR Code */}
          {qrCode && (
            <div className="text-center">
              <Label>Scan QR Code to Pay</Label>
              <div className="flex justify-center mt-2">
                <img
                  src={qrCode}
                  alt="UPI QR Code"
                  className="w-48 h-48 border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-center">
              <Label>Amount to Pay</Label>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                ₹{paymentAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Proof Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload size={20} />
            Upload Payment Proof
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentProofUpload onUpload={handleProofUpload} />
          
          {uploadedProof && (
            <div className="mt-4">
              <Button
                onClick={handleSubmitPayment}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Payment for Verification'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
