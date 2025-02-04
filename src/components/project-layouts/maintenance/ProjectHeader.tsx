import { format, subMonths } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";

interface ProjectHeaderProps {
  project: Tables<"projects"> & {
    client: {
      id: string;
      user_profiles: {
        first_name: string;
        last_name: string;
      } | null;
    } | null;
    status: {
      name: string;
      color_hex: string | null;
    } | null;
  };
  selectedMonth: string;
  onMonthChange: (value: string) => void;
}

const ProjectHeader = ({ project, selectedMonth, onMonthChange }: ProjectHeaderProps) => {
  // Get current date and generate last 5 months
  const currentDate = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(currentDate, i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMM yyyy')
    };
  });

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        {project.logo_url && (
          <img
            src={project.logo_url}
            alt={`${project.name} logo`}
            className="w-12 h-12 object-contain rounded"
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
        <div className="bg-[#fcfcfc] border border-gray-200 rounded-md shadow-sm">
          <Select
            value={selectedMonth}
            onValueChange={onMonthChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
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