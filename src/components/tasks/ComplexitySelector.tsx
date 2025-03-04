
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
    <div className="grid grid-cols-3 grid-rows-2 gap-1 w-full aspect-square">
      {/* First row */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onChange(1)}
              className={`flex items-center justify-center text-sm font-medium border transition-all ${
                value === 1 
                  ? 'bg-primary text-white border-primary shadow-sm' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              aria-pressed={value === 1}
            >
              01
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm font-semibold">{sortedLevels[0]?.name}</div>
            <div className="text-xs">{getComplexityTooltip(sortedLevels[0])}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onChange(2)}
              className={`flex items-center justify-center text-sm font-medium border transition-all ${
                value === 2 
                  ? 'bg-primary text-white border-primary shadow-sm' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              aria-pressed={value === 2}
            >
              02
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm font-semibold">{sortedLevels[1]?.name}</div>
            <div className="text-xs">{getComplexityTooltip(sortedLevels[1])}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Third box spans two rows */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onChange(6)}
              className={`flex items-center justify-center text-sm font-medium border transition-all row-span-2 ${
                value === 6 
                  ? 'bg-primary text-white border-primary shadow-sm' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              aria-pressed={value === 6}
            >
              06
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm font-semibold">{sortedLevels[5]?.name}</div>
            <div className="text-xs">{getComplexityTooltip(sortedLevels[5])}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Second row */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onChange(4)}
              className={`flex items-center justify-center text-sm font-medium border transition-all row-span-2 ${
                value === 4 
                  ? 'bg-primary text-white border-primary shadow-sm' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              aria-pressed={value === 4}
            >
              04
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm font-semibold">{sortedLevels[3]?.name}</div>
            <div className="text-xs">{getComplexityTooltip(sortedLevels[3])}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onChange(3)}
              className={`flex items-center justify-center text-sm font-medium border transition-all ${
                value === 3 
                  ? 'bg-primary text-white border-primary shadow-sm' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              aria-pressed={value === 3}
            >
              03
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm font-semibold">{sortedLevels[2]?.name}</div>
            <div className="text-xs">{getComplexityTooltip(sortedLevels[2])}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Last box in the grid */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onChange(5)}
              className={`flex items-center justify-center text-sm font-medium border transition-all col-span-2 ${
                value === 5 
                  ? 'bg-primary text-white border-primary shadow-sm' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              aria-pressed={value === 5}
            >
              05
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm font-semibold">{sortedLevels[4]?.name}</div>
            <div className="text-xs">{getComplexityTooltip(sortedLevels[4])}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
