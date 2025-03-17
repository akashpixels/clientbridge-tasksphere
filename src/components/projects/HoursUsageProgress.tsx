
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface HoursUsageProgressProps {
  hoursAllotted: number;  // Represents allocated_duration
  hoursSpent: number;     // Represents used_duration (formerly actual_duration)
  selectedMonth: string;
}

export const HoursUsageProgress = ({ hoursAllotted, hoursSpent, selectedMonth }: HoursUsageProgressProps) => {
  // Calculate percentage (capped at 100%)
  const percentUsed = hoursAllotted > 0 
    ? Math.min(Math.round((hoursSpent / hoursAllotted) * 100), 100) 
    : 0;
  
  // Determine color based on usage
  const getProgressColor = () => {
    if (percentUsed < 70) return "bg-green-500";
    if (percentUsed < 90) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Format for display
  const formatHours = (hours: number) => {
    return `${hours}h`;
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
            <span>{formatHours(hoursSpent)} used</span>
            <span>{formatHours(hoursAllotted)} allotted</span>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {percentUsed}% used
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
