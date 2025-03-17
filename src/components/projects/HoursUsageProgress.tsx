
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDuration } from "@/lib/date-utils";

interface HoursUsageProgressProps {
  hoursAllotted: string | number | object; // Matches the PostgreSQL interval type
  hoursSpent: string | number | object;    // Matches the PostgreSQL interval type
  selectedMonth: string;
}

export const HoursUsageProgress = ({ hoursAllotted, hoursSpent, selectedMonth }: HoursUsageProgressProps) => {
  // Convert interval objects to hours (as numbers)
  const getAllottedHours = () => {
    if (!hoursAllotted) return 0;
    
    // Format durations for display
    const formatted = formatDuration(hoursAllotted);
    // Extract hours as a number for calculation
    const match = formatted.match(/(\d+)h/);
    return match ? parseFloat(match[1]) : 0;
  };
  
  const getSpentHours = () => {
    if (!hoursSpent) return 0;
    
    // Format durations for display
    const formatted = formatDuration(hoursSpent);
    // Extract hours as a number for calculation
    const match = formatted.match(/(\d+)h/);
    return match ? parseFloat(match[1]) : 0;
  };
  
  const allottedHours = getAllottedHours();
  const spentHours = getSpentHours();
  
  // Calculate percentage (capped at 100%)
  const percentUsed = allottedHours > 0 
    ? Math.min(Math.round((spentHours / allottedHours) * 100), 100) 
    : 0;
  
  // Determine color based on usage
  const getProgressColor = () => {
    if (percentUsed < 70) return "bg-green-500";
    if (percentUsed < 90) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Format dates for display
  const monthYear = new Date(selectedMonth + "-01");
  const monthName = monthYear.toLocaleString('default', { month: 'long' });
  const year = monthYear.getFullYear();
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Hours Usage for {monthName} {year}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress 
            value={percentUsed} 
            className="h-3 w-full"
            indicatorClassName={getProgressColor()}
          />
          <div className="flex justify-between text-sm">
            <span>{formatDuration(hoursSpent)} used</span>
            <span>{formatDuration(hoursAllotted)} allotted</span>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {percentUsed}% used
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
