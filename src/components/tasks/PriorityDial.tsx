
import { useState, useRef } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDuration } from "@/lib/date-utils";

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
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const dialRef = useRef<SVGSVGElement>(null);

  // Sort priority levels by id to ensure correct order
  const sortedLevels = [...priorityLevels].sort((a, b) => a.id - b.id);
  
  // Get the currently selected priority level
  const selectedLevel = sortedLevels.find(level => level.id === value);
  
  // Calculate the angle based on the selected priority
  const getRotationAngle = (levelId: number) => {
    const index = sortedLevels.findIndex(level => level.id === levelId);
    const totalLevels = sortedLevels.length;
    // Distribute angles across 170 degrees (leaving 5 deg margins on each side)
    return -85 + (index * (170 / (totalLevels - 1)));
  };

  const handleDialClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!dialRef.current) return;
    
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height - 10; // Adjust for visual center
    
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Calculate angle from center to click point
    let angle = Math.atan2(clickY - centerY, clickX - centerX) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    if (angle > 180) return; // Ignore clicks outside the dial's active area
    
    // Map angle to priority level
    const index = Math.round((angle / 180) * (sortedLevels.length - 1));
    const clampedIndex = Math.max(0, Math.min(sortedLevels.length - 1, index));
    onChange(sortedLevels[clampedIndex].id);
  };

  const getPriorityTooltip = (level: PriorityLevel) => {
    if (!level) return "";
    const timeToStart = level.time_to_start ? formatDuration(level.time_to_start) : "immediate";
    const multiplier = level.multiplier ? `${level.multiplier}x duration` : "standard duration";
    return `${timeToStart} delay, ${multiplier}`;
  };

  // SVG parameters
  const width = 300;
  const height = compact ? 120 : 160;
  const radius = compact ? 100 : 120;
  const arcWidth = compact ? 16 : 24; // Reduced arc width 
  const needleLength = radius - 10;

  // Get selected priority level rotation
  const rotationAngle = getRotationAngle(value);

  return (
    <div className="relative w-full flex flex-col items-center">
      <svg 
        ref={dialRef}
        width="100%" 
        height={height} 
        viewBox={`0 0 ${width} ${height}`} 
        onClick={handleDialClick}
        className="cursor-pointer" 
        style={{ maxWidth: '100%' }}
      >
        {/* Dial background */}
        <path 
          d={`M 10 ${height} A ${radius} ${radius} 0 0 1 ${width - 10} ${height}`} 
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={arcWidth}
          strokeLinecap="round"
        />
        
        {/* Priority level arcs - with gaps between them */}
        {sortedLevels.map((level, i) => {
          // Calculate each arc's angle with a small gap
          const arcSpan = 170 / sortedLevels.length; // Total span divided by number of levels
          const gapSize = 3; // Degrees of gap between arcs
          const arcSize = arcSpan - gapSize; // Arc size with gap
          
          const midAngle = -85 + (i * arcSpan);
          const startAngle = midAngle - (arcSize / 2);
          const endAngle = midAngle + (arcSize / 2);
          
          const isSelected = level.id === value;
          
          // Start and end points of the arc
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          
          const x1 = width / 2 + radius * Math.sin(startRad);
          const y1 = height - radius * Math.cos(startRad);
          const x2 = width / 2 + radius * Math.sin(endRad);
          const y2 = height - radius * Math.cos(endRad);
          
          // Create an arc that spans between the two points
          const largeArcFlag = Math.abs(endAngle - startAngle) >= 180 ? 1 : 0;
          
          return (
            <TooltipProvider key={level.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <path 
                    d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                    fill="none"
                    stroke={level.color || "#888888"}
                    strokeWidth={arcWidth}
                    strokeLinecap="round"
                    style={{ 
                      opacity: isSelected ? 1 : (hoveredLevel === level.id ? 0.8 : 0.5),
                      transition: "opacity 0.2s ease-in-out",
                      cursor: "pointer"
                    }}
                    onMouseEnter={() => setHoveredLevel(level.id)}
                    onMouseLeave={() => setHoveredLevel(null)}
                    onClick={() => onChange(level.id)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm font-semibold">{level.name}</div>
                  <div className="text-xs">{getPriorityTooltip(level)}</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        
        {/* Center point */}
        <circle cx={width / 2} cy={height} r={compact ? 3 : 5} fill="#1f2937" />
        
        {/* Needle */}
        <line 
          x1={width / 2}
          y1={height}
          x2={width / 2 + needleLength * Math.sin((rotationAngle * Math.PI) / 180)}
          y2={height - needleLength * Math.cos((rotationAngle * Math.PI) / 180)}
          stroke="#1f2937"
          strokeWidth={compact ? 2 : 3}
          strokeLinecap="round"
          style={{ 
            transformOrigin: `${width / 2}px ${height}px`,
            transition: "all 0.3s ease-in-out" 
          }}
        />
        
        {/* Needle center */}
        <circle cx={width / 2} cy={height} r={compact ? 6 : 8} fill="#1f2937" />
      </svg>
      
      {/* Only show the selected priority level label */}
      {selectedLevel && (
        <div className="flex justify-center w-full mt-2 px-4">
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
