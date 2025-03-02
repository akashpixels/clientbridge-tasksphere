
import { Tables } from "@/integrations/supabase/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface ProjectHeaderProps {
  project: Tables<"projects"> & {
    client_admin: {
      id: string;
      business_name: string;
      user_profiles: {
        first_name: string;
        last_name: string;
      } | null;
    } | null;
    project_subscriptions?: {
      id: string;
      subscription_status: string;
      hours_allotted: number;
      next_renewal_date: string;
    }[];
    subscription_data?: {
      hours_spent: number;
      hours_allotted: number;
      data_source: string;
    };
  };
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  monthlyHours: number;
}

const ProjectHeader = ({ project, selectedMonth, onMonthChange, monthlyHours }: ProjectHeaderProps) => {
  // Generate last 6 months options (current month + 5 previous months)
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMM yyyy')
    };
  });

  // Get subscription data
  const subscriptionData = project.subscription_data || {
    hours_spent: monthlyHours,
    hours_allotted: project.project_subscriptions?.[0]?.hours_allotted || 0,
    data_source: "unknown"
  };
  
  // Calculate usage percentage for progress bar
  const usagePercentage = subscriptionData.hours_allotted > 0 
    ? Math.min(Math.round((subscriptionData.hours_spent / subscriptionData.hours_allotted) * 100), 100)
    : 0;

  console.log("ProjectHeader rendering with data:", {
    selectedMonth,
    subscriptionData,
    monthlyHours,
    usagePercentage
  });

  return (
    <div className="flex items-center justify-between w-full gap-4">
      <div className="flex items-center gap-4">
        {project.logo_url && (
          <img 
            src={project.logo_url} 
            alt={`${project.name} logo`}
            className="w-16 h-16 object-contain rounded-lg"
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-gray-500">
            {project.client_admin?.user_profiles ? 
              `${project.client_admin.user_profiles.first_name} ${project.client_admin.user_profiles.last_name}` : 
              project.client_admin?.business_name || 'No Client'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        
        {/* Subscription Details Card */}
        <div className="border border-gray-200 rounded-lg p-4 bg-[#fcfcfc]">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Subscription Details</h3>
          <ul className="space-y-2 text-sm">
            <li className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Hours Usage:</span>
                <span className="font-medium text-gray-900">
                  {subscriptionData.hours_spent?.toFixed(1) || "0"} / {subscriptionData.hours_allotted || "0"}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="font-medium text-gray-900">{project.project_subscriptions?.[0]?.subscription_status || "unknown"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Next Renewal:</span>
              <span className="font-medium text-gray-900">{project.project_subscriptions?.[0]?.next_renewal_date || "unknown"}</span>
            </li>
            <li className="flex justify-between text-xs text-gray-400">
              <span>Data Source:</span>
              <span>{subscriptionData.data_source}</span>
            </li>
          </ul>
        </div>
        
        {/* Month Selector */}
        <div className="bg-[#fcfcfc]">
          <Select
            value={selectedMonth}
            onValueChange={onMonthChange}
          >
           <SelectTrigger className="w-[108px] h-[108px] flex flex-col items-center justify-between p-4 rounded-[4px] border border-gray-200 focus:ring-0 focus:border-gray-200 bg-transparent">
              <SelectValue placeholder="Select month">
                {selectedMonth && (
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-semibold">
                      {format(new Date(selectedMonth), 'MMM')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(selectedMonth), 'yyyy')}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#fcfcfc]">
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
