
import React from 'react';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getComplexityBars } from '../../utils/taskFormatters';

interface TaskComplexityBarProps {
  complexity: {
    name: string;
    multiplier: number;
  } | null;
}

export const TaskComplexityBar: React.FC<TaskComplexityBarProps> = ({ complexity }) => {
  const bars = getComplexityBars(complexity);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex gap-0.5 justify-center">
            {[...Array(6)].map((_, index) => (
              <div 
                key={index} 
                className={`w-1 h-4 rounded-sm ${index < bars ? 'bg-gray-600' : 'bg-gray-200'}`} 
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

export default TaskComplexityBar;
