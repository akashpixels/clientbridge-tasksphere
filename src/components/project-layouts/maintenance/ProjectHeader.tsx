import { Tables } from "@/integrations/supabase/types";
import ProjectStats from "./ProjectStats";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths } from "date-fns";
import { Calendar } from "lucide-react";

interface ProjectHeaderProps {
  project: Tables<"projects"> & {
    client: {
      id: string;
      user_profiles: {
        first_name: string;
        last_name: string;
      } | null;
    } | null;
  };
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const ProjectHeader = ({ project, selectedMonth, onMonthChange }: ProjectHeaderProps) => {
  // Generate last 6 months options (current month + 5 previous months)
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMM yyyy')
    };
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
            {project.client?.user_profiles ? 
              `${project.client.user_profiles.first_name} ${project.client.user_profiles.last_name}` 
              : 'No Client'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="glass-card rounded-md">
          <Select
            value={selectedMonth}
            onValueChange={onMonthChange}
          >
            <SelectTrigger className="w-[180px] bg-[#fcfcfc] border-gray-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 opacity-50" />
                <SelectValue placeholder="Select month" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#fcfcfc] border border-gray-200 shadow-sm">
              {monthOptions.map((month) => (
                <SelectItem 
                  key={month.value} 
                  value={month.value}
                  className="hover:bg-gray-50"
                >
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ProjectStats project={project} selectedMonth={selectedMonth} />
      </div>
    </div>
  );
};

export default ProjectHeader;