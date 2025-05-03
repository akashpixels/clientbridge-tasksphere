
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDuration } from "@/lib/date-utils";
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PriorityLevel {
  id: number;
  name: string;
  color_hex: string;
  multiplier?: number;
  start_delay?: string | number | object;
}

interface PrioritySelectorProps {
  value: number;
  onChange: (value: number) => void;
  priorityLevels?: PriorityLevel[];
  compact?: boolean;
}

export const PrioritySelector = ({ priorityLevels, value, onChange, compact = false }: PrioritySelectorProps) => {
  const [levels, setLevels] = useState<PriorityLevel[]>([]);
  
  // Fetch priority levels if they're not provided as props
  useEffect(() => {
    const fetchPriorityLevels = async () => {
      try {
        const { data, error } = await supabase
          .from('priority_levels')
          .select('id, name, color_hex, multiplier, start_delay')
          .order('id', { ascending: true });
          
        if (error) {
          console.error("Error fetching priority levels:", error);
          return;
        }
        
        if (data) {
          setLevels(data);
        }
      } catch (err) {
        console.error("Failed to fetch priority levels:", err);
      }
    };
    
    if (!priorityLevels || priorityLevels.length === 0) {
      fetchPriorityLevels();
    } else {
      setLevels(priorityLevels);
    }
  }, [priorityLevels]);
  
  // Sort priority levels by id to ensure correct order
  const sortedLevels = [...levels].sort((a, b) => a.id - b.id);
  
  const getPriorityTooltip = (level: PriorityLevel) => {
    if (!level) return "";
    const timeToStart = level.start_delay !== undefined ? formatDuration(level.start_delay) : "immediate";
    const multiplier = level.multiplier ? `${level.multiplier}x duration` : "standard duration";
    return `${timeToStart} delay, ${multiplier}`;
  };

  if (levels.length === 0) {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <AlertCircle className="h-4 w-4 mr-2" />
        Loading priorities...
      </div>
    );
  }

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
                  backgroundColor: value === level.id ? `${level.color_hex}15` : '',
                  borderColor: value === level.id ? level.color_hex : '',
                  color: value === level.id ? level.color_hex : '#8E9196'
                }}
                onClick={() => onChange(level.id)}
              >
                <div className="flex items-center">
                  <span 
                    className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                    style={{ backgroundColor: level.color_hex || '#888888' }}
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
