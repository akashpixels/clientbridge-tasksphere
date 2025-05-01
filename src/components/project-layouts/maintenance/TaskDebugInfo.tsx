
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Clock, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface TaskDebugInfoProps {
  taskId: string;
  extraDetails?: Record<string, any> | null;
}

function formatDuration(duration: string | null | undefined) {
  if (!duration) return "N/A";
  
  // Simple formatting for interval types
  if (duration.includes(':')) {
    const parts = duration.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}h ${parts[1]}m ${parseFloat(parts[2] || '0').toFixed(0)}s`;
    }
  }
  
  return duration;
}

function formatTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) return "N/A";
  
  try {
    return format(new Date(timestamp), "MMM d, yyyy h:mm:ss a");
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    return timestamp;
  }
}

const TaskDebugInfo = ({ taskId, extraDetails }: TaskDebugInfoProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!extraDetails || Object.keys(extraDetails).length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info size={16} /> ETA Calculation Details
          </CardTitle>
          <CardDescription>
            No calculation details available for this task
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            ETA Calculation Details
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </CardTitle>
        <CardDescription>
          Calculation performed at {formatTimestamp(extraDetails.calculation_time)}
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="text-sm">
          <div className="space-y-3">
            <div>
              <p className="font-medium mb-1">Base Time:</p>
              <Badge variant="outline" className="font-mono text-xs">
                {formatTimestamp(extraDetails.base_time)}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">
                (The time used as a starting point for this task's scheduling)
              </p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium mb-1">Gap Time:</p>
                <Badge variant="outline" className="font-mono text-xs">
                  {formatDuration(extraDetails.gap_time)}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  (Working time between now and base time)
                </p>
              </div>
              
              <div>
                <p className="font-medium mb-1">Spent Time:</p>
                <Badge variant="outline" className="font-mono text-xs">
                  {formatDuration(extraDetails.spent_time)}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  (Working time between creation and now)
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium mb-1">Delta:</p>
                <Badge variant="outline" className="font-mono text-xs">
                  {formatDuration(extraDetails.delta)}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  (Time adjustment based on recalculation status)
                </p>
              </div>
              
              <div>
                <p className="font-medium mb-1">Delay:</p>
                <Badge variant="outline" className="font-mono text-xs">
                  {formatDuration(extraDetails.delay)}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  (Final delay applied before start time)
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium mb-1">Priority:</p>
                <Badge variant="outline" className="font-mono text-xs">
                  {extraDetails.priority_name} (ID: {extraDetails.priority_level_id})
                </Badge>
              </div>
              
              <div>
                <p className="font-medium mb-1">Recalculation:</p>
                <Badge variant={extraDetails.is_recalc ? "default" : "secondary"} className="font-mono text-xs">
                  {extraDetails.is_recalc ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium mb-1">Estimated Duration:</p>
                <Badge variant="outline" className="font-mono text-xs">
                  {formatDuration(extraDetails.est_duration)}
                </Badge>
              </div>
              
              <div>
                <p className="font-medium mb-1">Blocked Duration:</p>
                <Badge variant="outline" className="font-mono text-xs">
                  {formatDuration(extraDetails.total_blocked_duration)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default TaskDebugInfo;
