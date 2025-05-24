
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Building } from "lucide-react";
import { useAgencySettings } from '../hooks/useAgencySettings';
import { PaymentProofUpload } from './PaymentProofUpload';
import { useToast } from "@/hooks/use-toast";

interface BankPaymentSectionProps {
  paymentAmount: number;
  onPaymentSubmit: (proofData: any) => void;
}

export const BankPaymentSection: React.FC<BankPaymentSectionProps> = ({
  paymentAmount,
  onPaymentSubmit
}) => {
  const [uploadedProof, setUploadedProof] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: settings } = useAgencySettings();
  const { toast } = useToast();

  const bankDetails = settings?.footerDetails?.bankDetails;

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

  const formatBankDetails = (details: any): string => {
    if (typeof details === 'string') return details;
    if (!details || typeof details !== 'object') return 'Bank details not available';
    
    const formattedLines = [];
    if (details.account_holder) formattedLines.push(`Account Holder: ${details.account_holder}`);
    if (details.account_number) formattedLines.push(`Account Number: ${details.account_number}`);
    if (details.bank_name) formattedLines.push(`Bank Name: ${details.bank_name}`);
    if (details.ifsc) formattedLines.push(`IFSC Code: ${details.ifsc}`);
    if (details.pan) formattedLines.push(`PAN: ${details.pan}`);
    
    return formattedLines.join('\n');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building size={20} />
            Bank Transfer Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bank Details */}
          <div>
            <Label>Bank Details</Label>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm whitespace-pre-line font-mono">
                {formatBankDetails(bankDetails)}
              </pre>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-center">
              <Label>Amount to Transfer</Label>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                ₹{paymentAmount.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Instructions:</strong>
              <br />• Transfer the exact amount mentioned above
              <br />• Use the reference/description: Invoice Payment
              <br />• Upload the transfer receipt/screenshot below
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Proof Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload size={20} />
            Upload Transfer Receipt
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
