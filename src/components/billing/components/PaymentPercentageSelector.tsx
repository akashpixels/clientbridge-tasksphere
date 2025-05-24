
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";

interface PaymentPercentageSelectorProps {
  percentage: number;
  onPercentageChange: (percentage: number) => void;
  baseAmount: number;
}

export const PaymentPercentageSelector: React.FC<PaymentPercentageSelectorProps> = ({
  percentage,
  onPercentageChange,
  baseAmount
}) => {
  const handlePercentageChange = (newPercentage: number) => {
    const clampedPercentage = Math.max(10, Math.min(100, newPercentage));
    onPercentageChange(clampedPercentage);
  };

  const incrementPercentage = () => {
    handlePercentageChange(percentage + 10);
  };

  const decrementPercentage = () => {
    handlePercentageChange(percentage - 10);
  };

  const presetPercentages = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={decrementPercentage}
          disabled={percentage <= 10}
        >
          <Minus size={16} />
        </Button>
        
        <div className="flex-1 relative">
          <Input
            type="number"
            value={percentage}
            onChange={(e) => handlePercentageChange(parseInt(e.target.value) || 10)}
            min={10}
            max={100}
            step={10}
            className="text-center"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
            %
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={incrementPercentage}
          disabled={percentage >= 100}
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* Preset Percentage Buttons */}
      <div className="grid grid-cols-5 gap-2">
        {presetPercentages.map((preset) => (
          <Button
            key={preset}
            variant={percentage === preset ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePercentageChange(preset)}
            className="text-xs"
          >
            {preset}%
          </Button>
        ))}
      </div>

      {/* Amount Display */}
      <div className="text-center p-2 bg-gray-50 rounded">
        <span className="text-sm text-gray-600">Payment Amount: </span>
        <span className="font-semibold">₹{((baseAmount * percentage) / 100).toFixed(2)}</span>
      </div>
    </div>
  );
};
