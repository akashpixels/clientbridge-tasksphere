
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskComplexityCellProps {
  complexity: {
    name: string;
    multiplier: number;
  } | null;
}

export const TaskComplexityCell = ({ complexity }: TaskComplexityCellProps) => {
  const getComplexityBars = (complexity: { name: string, multiplier: number } | null) => {
    if (!complexity) return 1;
    
    const complexityMap: { [key: string]: number } = {
      'Basic': 1,
      'Standard': 2,
      'Advanced': 3,
      'Complex': 4,
      'Very Complex': 5,
      'Extreme': 6
    };

    return complexityMap[complexity.name] || 1;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex gap-0.5">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className={`w-1 h-4 rounded-sm ${
                  index < getComplexityBars(complexity)
                    ? 'bg-gray-600'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-[#fcfcfc]">
          <p>{complexity?.name || 'Not set'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
