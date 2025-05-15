
import { Tables } from "@/integrations/supabase/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths } from "date-fns";
import { ReactNode } from "react";

interface ProjectHeaderProps {
  project: Tables<"projects"> & {
    client_admin?: {
      id: string;
      business_name: string;
      user_profiles?: {
        first_name: string;
        last_name: string;
      } | null;
    } | null;
    status?: {
      name: string;
      color_hex: string | null;
    } | null;
  };
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  statsComponent?: ReactNode;
}

const ProjectHeader = ({
  project,
  selectedMonth = format(new Date(), 'yyyy-MM'),
  onMonthChange,
  statsComponent
}: ProjectHeaderProps) => {
  // Generate last 6 months options (current month + 5 previous months)
  const monthOptions = Array.from({
    length: 6
  }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMM yyyy')
    };
  });
  
  return (
    <div className="flex items-center justify-between w-full gap-4">
      <div className="flex items-center gap-4">
        {project.logo_url && <img src={project.logo_url} alt={`${project.name} logo`} className="w-16 h-16 object-contain rounded-lg" />}
        <div>
          <h1 className="font-semibold text-lg">{project.name}</h1>
          <p className="text-gray-500">
            {project.client_admin?.user_profiles ? 
              `${project.client_admin.user_profiles.first_name} ${project.client_admin.user_profiles.last_name}` : 
              project.client_admin?.business_name || 'No Client'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {statsComponent}
        
        {onMonthChange && (
          <div className="bg-card">
            <Select value={selectedMonth} onValueChange={onMonthChange}>
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
              <SelectContent className="bg-card">
                {monthOptions.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader;
