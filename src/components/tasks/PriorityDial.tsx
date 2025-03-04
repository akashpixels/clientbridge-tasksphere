
import { useState, useEffect, useRef } from "react";
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
  const arcWidth = compact ? 20 : 30;
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
        
        {/* Priority level arcs */}
        {sortedLevels.map((level, i) => {
          const startAngle = -85 + (i * (170 / (sortedLevels.length - 1))) - (170 / (2 * (sortedLevels.length - 1)));
          const endAngle = -85 + (i * (170 / (sortedLevels.length - 1))) + (170 / (2 * (sortedLevels.length - 1)));
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
      
      {/* Priority level labels */}
      <div className="flex justify-between w-full mt-1 px-4 text-xs text-muted-foreground">
        {sortedLevels.map((level) => (
          <div 
            key={level.id} 
            className="flex flex-col items-center cursor-pointer"
            onClick={() => onChange(level.id)}
            style={{ 
              color: level.id === value ? level.color : 'inherit',
              fontWeight: level.id === value ? 'bold' : 'normal'
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full mb-1" style={{ backgroundColor: level.color }} />
            <span className={compact ? "text-[10px]" : "text-xs"}>{level.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
