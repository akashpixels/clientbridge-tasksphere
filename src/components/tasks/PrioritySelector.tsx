
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDuration } from "@/lib/date-utils";

interface PriorityLevel {
  id: number;
  name: string;
  color: string;
  multiplier?: number;
  time_to_start?: string | number;
}

interface PrioritySelectorProps {
  priorityLevels: PriorityLevel[];
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
}

export const PrioritySelector = ({ priorityLevels, value, onChange }: PrioritySelectorProps) => {
  // Sort priority levels by id to ensure correct order
  const sortedLevels = [...priorityLevels].sort((a, b) => a.id - b.id);
  
  const getPriorityTooltip = (level: PriorityLevel) => {
    if (!level) return "";
    const timeToStart = level.time_to_start !== undefined ? formatDuration(level.time_to_start) : "immediate";
    const multiplier = level.multiplier ? `${level.multiplier}x duration` : "standard duration";
    return `${timeToStart} delay, ${multiplier}`;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {sortedLevels.map(level => (
        <TooltipProvider key={level.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`cursor-pointer px-3 py-1 hover:bg-muted transition-colors`}
                style={{
                  backgroundColor: value === level.id ? `${level.color}15` : '',
                  borderColor: value === level.id ? level.color : '',
                  color: value === level.id ? level.color : '#8E9196'
                }}
                onClick={() => onChange(level.id)}
              >
                <div className="flex items-center">
                  <span 
                    className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                    style={{ backgroundColor: level.color || '#888888' }}
                  />
                  {level.name}
                </div>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getPriorityTooltip(level)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};
