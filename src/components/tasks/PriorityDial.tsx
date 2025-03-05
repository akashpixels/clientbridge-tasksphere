
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDuration } from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PriorityLevel {
  id: number;
  name: string;
  color: string;
  multiplier?: number;
  time_to_start?: string;
}

interface PriorityDialProps {
  priorityLevels: PriorityLevel[];
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
}

export const PriorityDial = ({ priorityLevels, value, onChange, compact = false }: PriorityDialProps) => {
  // Sort priority levels by id to ensure correct order
  const sortedLevels = [...priorityLevels].sort((a, b) => a.id - b.id);
  
  // Get the currently selected priority level
  const selectedLevel = sortedLevels.find(level => level.id === value);

  const getPriorityTooltip = (level: PriorityLevel) => {
    if (!level) return "";
    const timeToStart = level.time_to_start ? formatDuration(level.time_to_start) : "immediate";
    const multiplier = level.multiplier ? `${level.multiplier}x duration` : "standard duration";
    return `${timeToStart} delay, ${multiplier}`;
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center gap-2 my-2">
        {sortedLevels.map((level) => (
          <TooltipProvider key={level.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className={cn(
                    "px-3 py-1 cursor-pointer transition-all duration-200",
                    value === level.id 
                      ? "bg-opacity-100 shadow-md scale-105" 
                      : "bg-opacity-60 hover:bg-opacity-80"
                  )}
                  style={{ 
                    backgroundColor: level.color,
                    color: getContrastColor(level.color),
                    borderColor: "transparent"
                  }}
                  onClick={() => onChange(level.id)}
                >
                  {level.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm font-semibold">{level.name}</div>
                <div className="text-xs">{getPriorityTooltip(level)}</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      
      {/* Selected priority level indicator */}
      {selectedLevel && !compact && (
        <div className="flex justify-center w-full mt-2">
          <div 
            className="flex flex-col items-center"
            style={{ 
              color: selectedLevel.color,
              fontWeight: 'bold'
            }}
          >
            <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: selectedLevel.color }} />
            <span className="text-sm">{selectedLevel.name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to determine if text should be white or black based on background color
function getContrastColor(hexColor: string): string {
  // Remove the leading # if it exists
  const color = hexColor.replace('#', '');
  
  // Convert hex to RGB
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);
  
  // If the hex color is shorter (e.g. #fff), convert it
  if (color.length === 3) {
    r = parseInt(color.substring(0, 1).repeat(2), 16);
    g = parseInt(color.substring(1, 2).repeat(2), 16);
    b = parseInt(color.substring(2, 3).repeat(2), 16);
  }
  
  // Calculate the perceived brightness
  // Formula: (0.299*R + 0.587*G + 0.114*B)
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
  
  // Return white or black based on brightness
  return brightness < 160 ? 'white' : 'black';
}
