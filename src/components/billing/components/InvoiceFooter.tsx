
import React from 'react';

interface InvoiceFooterProps {
  notes?: string;
  upiAddress?: string;
  bankDetails?: Record<string, string> | string;
  qrCode?: string;
  signature?: string;
  stamp?: string;
}

export const InvoiceFooter: React.FC<InvoiceFooterProps> = ({
  notes,
  upiAddress,
  bankDetails,
  qrCode,
  signature,
  stamp
}) => {
  console.log('QR code in InvoiceFooter:', qrCode); // Debug log to see what's received by the component
  
  // Format bank details if it's an object
  const formatBankDetails = (details: Record<string, string> | string): string => {
    if (typeof details === 'string') return details;
    if (!details || typeof details !== 'object') return '';
    
    const formattedLines = [];
   
    if (details.account_holder) formattedLines.push(`${details.account_holder}`);
    if (details.account_number) formattedLines.push(`A/c: ${details.account_number}`);
     if (details.bank_name) formattedLines.push(` ${details.bank_name}`);
    if (details.ifsc) formattedLines.push(`IFSC: ${details.ifsc}`);
    if (details.pan) formattedLines.push(`PAN: ${details.pan}`);
    
    return formattedLines.join('\n');
  };

 return (
  <div className="!mt-48 pb-6 border-b">
    {/* Two Column Footer */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Left Column - Signature and Notes */}
      <div className="flex flex-col md:items-start justify-end min-h-[150px]">
        {/* Signature and Stamp */}
        <div className="relative w-24 h-24 mb-4">
          {stamp && (
            <img
              src={stamp}
              alt="Company Stamp"
              className="w-20 h-20 object-contain absolute left-0 top-0 z-0"
            />
          )}
          {signature && (
            <img
              src={signature}
              alt="Authorized Signature"
              className="w-32 h-16 object-contain absolute left-6 top-0 z-10"
            />
          )}
        </div>
        {/* Notes */}
        {notes && (
          <div className="pt-2">
            <h4 className="font-semibold text-sm mb-1">Notes:</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line">{notes}</p>
          </div>
        )}
      </div>

      {/* Right Column - Payment Info */}
      <div className="flex flex-col items-end">
        {/* UPI Address */}
        {upiAddress && (
          <div className="pr-2 pb-1 w-full text-right">
            <span className="text-xs text-gray-600">{upiAddress}</span>
          </div>
        )}
        {/* QR + Bank Details Box */}
        <div className="flex border rounded-lg overflow-hidden bg-white min-w-[330px]">
          {/* QR Code */}
          <div className="flex flex-col justify-center items-center p-4">
            {qrCode && (
              <img
                src={qrCode}
                alt="QR Code"
                className="w-24 h-24 border rounded"
              />
            )}
          </div>
          {/* Bank Details */}
          {bankDetails && (
            <div className="text-xs border-l p-4 flex flex-col justify-center min-w-[170px]">
              <pre className="text-gray-700 leading-snug font-sans whitespace-pre-line">
                {formatBankDetails(bankDetails)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
