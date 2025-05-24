
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check, Upload } from "lucide-react";
import { useAgencySettings } from '../hooks/useAgencySettings';
import { PaymentProofUpload } from './PaymentProofUpload';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: 'upi' | 'bank' | 'card';
  paymentAmount: number;
  onPaymentSubmit: (proofData?: any) => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  paymentMethod,
  paymentAmount,
  onPaymentSubmit
}) => {
  const [paymentDone, setPaymentDone] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const { data: settings } = useAgencySettings();

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handlePaymentDone = () => {
    setPaymentDone(true);
  };

  const handleProofSubmit = (proofData: any) => {
    onPaymentSubmit(proofData);
    onClose();
    setPaymentDone(false);
  };

  const upiAddress = settings?.footerDetails?.upiAddress || 'akashpixel@sbi';
  const qrCode = settings?.footerDetails?.qrCode;
  const bankDetails = settings?.footerDetails?.bankDetails;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {paymentMethod === 'upi' ? 'UPI Payment' : 'Bank Transfer'}
          </DialogTitle>
        </DialogHeader>

        {!paymentDone ? (
          <div className="space-y-6">
            {/* Payment Amount */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-blue-600 mb-1">Amount to Pay</div>
                <div className="text-2xl font-bold text-blue-800">₹{paymentAmount.toFixed(2)}</div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            {paymentMethod === 'upi' ? (
              <div className="space-y-4">
                {qrCode && (
                  <div className="text-center">
                    <img src={qrCode} alt="UPI QR Code" className="mx-auto max-w-48 rounded-lg" />
                  </div>
                )}
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">UPI ID</div>
                  <div className="flex items-center justify-center space-x-2">
                    <code className="bg-gray-100 px-3 py-2 rounded text-sm">{upiAddress}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(upiAddress, 'UPI ID')}
                    >
                      {copiedText === 'UPI ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {bankDetails && (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Account Name</div>
                        <div className="font-medium">{bankDetails.account_holder}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Account Number</div>
                        <div className="font-medium">{bankDetails.account_number}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Bank Name</div>
                        <div className="font-medium">{bankDetails.bank_name}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">IFSC Code</div>
                        <div className="font-medium">{bankDetails.ifsc}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(
                        `Account: ${bankDetails.account_number}\nIFSC: ${bankDetails.ifsc}\nBank: ${bankDetails.bank_name}`,
                        'Bank Details'
                      )}
                      className="w-full"
                    >
                      {copiedText === 'Bank Details' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      Copy Bank Details
                    </Button>
                  </>
                )}
              </div>
            )}

            <Button onClick={handlePaymentDone} className="w-full">
              Payment Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center text-green-600 mb-4">
              <Check className="h-12 w-12 mx-auto mb-2" />
              <div className="font-medium">Payment Completed!</div>
              <div className="text-sm text-gray-600">Please upload payment proof</div>
            </div>
            
            <PaymentProofUpload onUploadComplete={handleProofSubmit} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
