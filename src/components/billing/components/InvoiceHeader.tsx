
import React from 'react';
import { format } from 'date-fns';

interface InvoiceHeaderProps {
  agencyLogo?: string;
  documentType: string;
  documentNumber?: string;
  agencyEmail?: string;
  agencyPhone?: string;
  issueDate: Date;
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
  agencyLogo,
  documentType,
  documentNumber,
  agencyEmail,
  agencyPhone,
  issueDate
}) => {
  const capitalizedType = documentType.charAt(0).toUpperCase() + documentType.slice(1);
  
  return (
    <div className="flex justify-between items-start ">
      {/* Left side - Logo, Doc Number, Contact Info */}
      <div className="flex items-start space-x-4">
        {/* Logo */}
        {agencyLogo && (
          <img 
            src={agencyLogo} 
            alt="Agency Logo" 
            className="h-12 w-12 object-contain"
          />
        )}
        
        <div className="space-x-2 flex">
          {/* Document Number */}
            <div className=" flex-col">
          
          <h2 className=" text-sm">Serial No</h2>
          {documentNumber && (
            <h2 className=" text-sm">{documentNumber}</h2>
          )}
          </div>
          {/* Contact Info */}
          <div className="text-sm text-gray-600 border-l pl-2">
            {agencyEmail && <p>{agencyEmail}</p>}
            {agencyPhone && <p>{agencyPhone}</p>}
          </div>
        </div>
      </div>
      
      {/* Right side - Document Type and Date */}
      <div className="text-right">
        <h1 className="text-2xl font-bold text-gray-800">{capitalizedType}</h1>
        <p className="text-sm text-gray-500">
          {format(new Date(issueDate), 'dd MMM yyyy')}
        </p>
      </div>
    </div>
  );
};
