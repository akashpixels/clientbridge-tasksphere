
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
    if (details.bank_name) formattedLines.push(`Bank: ${details.bank_name}`);
    if (details.account_holder) formattedLines.push(`A/c Holder: ${details.account_holder}`);
    if (details.account_number) formattedLines.push(`A/c No: ${details.account_number}`);
    if (details.ifsc) formattedLines.push(`IFSC: ${details.ifsc}`);
    if (details.pan) formattedLines.push(`PAN: ${details.pan}`);
    
    return formattedLines.join('\n');
  };

  return (
    <div className="mt-8 pb-6 border-b">
      {/* Notes Section */}
  
      {/* Two Column Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* Left Column - Signature and Stamp */}
        <div className="flex flex-col md:items-start justify-end">
          <div className="relative w-24 h-24">
            {signature && (
              <img
                src={signature}
                alt="Authorized Signature"
                className="w-32 h-16 object-contain absolute left-6 top-0 z-10"
              />
            )}

            {stamp && (
              <img
                src={stamp}
                alt="Company Stamp"
                className="w-20 h-20 object-contain absolute left-0 top-0 z-0"
              />
            )}
          </div>
          
          {notes && (
            <div className="">
              <h4 className="font-semibold text-sm mb-2">Notes:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line">{notes}</p>
            </div>
          )}
        </div>
        
        {/* Right Column - Payment Info */}
        <div className="space-y-4">
          {/* UPI Address */}
          {upiAddress && (
            <div className="text-sm pl-6">
              <p className="text-gray-600">{upiAddress}</p>
            </div>
          )}

          <div className="flex ">
            {/* QR Code */}
            <div className="border rounded-lg item-center">
              
          <div className="flex-col ">
               {upiAddress && (
            <div className="text-sm pl-6">
              <p className="text-gray-600">{upiAddress}</p>
            </div>
          )}
              {qrCode && (
                <div className="text-center md:text-right p-4">
                  {/* <h4 className="font-medium mb-2 text-sm">Scan to Pay</h4>*/}
                  <img 
                    src={qrCode} 
                    alt="QR Code" 
                    className="w-32 h-32 mx-auto md:ml-auto md:mr-0 border rounded"
                  />
                </div>
              )}
                </div>
              {/* Bank Details */}
              {bankDetails && (
                <div className="text-sm border-l p-4">
                  <h4 className="font-medium mb-1">Bank Details:</h4>
                  <p className="text-gray-600 whitespace-pre-line">
                    {formatBankDetails(bankDetails)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
