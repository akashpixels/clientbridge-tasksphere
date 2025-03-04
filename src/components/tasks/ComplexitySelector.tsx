
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ComplexityLevel {
  id: number;
  name: string;
  multiplier: number;
}

interface ComplexitySelectorProps {
  complexityLevels: ComplexityLevel[];
  value: number;
  onChange: (value: number) => void;
}

export const ComplexitySelector = ({ complexityLevels, value, onChange }: ComplexitySelectorProps) => {
  // Sort complexity levels by id to ensure correct order
  const sortedLevels = [...complexityLevels].sort((a, b) => a.id - b.id);
  
  const getComplexityTooltip = (level: ComplexityLevel) => {
    if (!level) return "";
    const multiplier = level.multiplier;
    if (multiplier < 1) {
      return `${Math.round((1 - multiplier) * 100)}% faster completion`;
    } else if (multiplier === 1) {
      return "Standard completion time";
    } else {
      return `${Math.round((multiplier - 1) * 100)}% longer completion`;
    }
  };

  return (
    <div className="flex justify-between w-full gap-2">
      {sortedLevels.map((level) => {
        const isSelected = level.id === value;
        
        return (
          <TooltipProvider key={level.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onChange(level.id)}
                  className={`flex-1 aspect-square flex items-center justify-center text-sm font-medium rounded border transition-all ${
                    isSelected 
                      ? 'bg-primary text-white border-primary shadow-sm' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                  aria-pressed={isSelected}
                >
                  {level.id}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm font-semibold">{level.name}</div>
                <div className="text-xs">{getComplexityTooltip(level)}</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};
