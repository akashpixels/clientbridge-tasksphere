
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaymentPercentageDropdownProps {
  percentage: number;
  onPercentageChange: (percentage: number) => void;
  baseAmount: number;
}

export const PaymentPercentageDropdown: React.FC<PaymentPercentageDropdownProps> = ({
  percentage,
  onPercentageChange,
  baseAmount
}) => {
  const percentageOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Payment Percentage</label>
      <Select value={percentage.toString()} onValueChange={(value) => onPercentageChange(parseInt(value))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select percentage" />
        </SelectTrigger>
        <SelectContent>
          {percentageOptions.map((percent) => (
            <SelectItem key={percent} value={percent.toString()}>
              {percent}% - ₹{((baseAmount * percent) / 100).toFixed(2)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
