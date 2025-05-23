
import React from 'react';
import { format } from 'date-fns';

interface InvoiceInfoColumnsProps {
  agencyName?: string;
  agencyAddress?: string;
  agencyGSTIN?: string;
  clientName?: string;
  clientAddress?: string;
  clientGSTIN?: string;
  totalAmount: number;
  dueDate?: Date;
}

export const InvoiceInfoColumns: React.FC<InvoiceInfoColumnsProps> = ({
  agencyName,
  agencyAddress,
  agencyGSTIN,
  clientName,
  clientAddress,
  clientGSTIN,
  totalAmount,
  dueDate
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 rounded-xl mb-8 border">
      {/* Column 1 - Agency Details */}
      <div className="space-y-2 border-r p-4">
        <h3 className="font-semibold text-gray-700">From:</h3>
        <div className="text-sm space-y-1">
          {agencyName && <p className="font-medium">{agencyName}</p>}
          {agencyAddress && <p className="whitespace-pre-line">{agencyAddress}</p>}
          {agencyGSTIN && <p>GSTIN: {agencyGSTIN}</p>}
        </div>
      </div>
      
      {/* Column 2 - Client Details */}
      <div className="space-y-2 border-r p-4">
        <h3 className="font-semibold text-gray-700">Billed To:</h3>
        <div className="text-sm space-y-1">
          {clientName && <p className="font-medium">{clientName}</p>}
          {clientAddress && <p className="whitespace-pre-line">{clientAddress}</p>}
          {clientGSTIN && <p>GSTIN: {clientGSTIN}</p>}
        </div>
      </div>
      
      {/* Column 3 - Total Due & Due Date */}
      <div className="space-y-2 p-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          
          <div className="text-sm flex flex-col justify-between">
            <div className="flex justify-between flex-col items-center">
              <span>Total Due:</span>
              <span className="font-bold text-base">₹{totalAmount.toFixed(2)}</span>
            </div>
            {dueDate && (
              <div className="flex justify-between flex-col items-center">
                <span>Due Date:</span>
                <span>{format(new Date(dueDate), 'dd MMM yyyy')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
