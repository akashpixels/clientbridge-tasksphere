import { Tables } from "@/integrations/supabase/types";
import ProjectStats from "./ProjectStats";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths } from "date-fns";
import { ChevronDown } from "lucide-react"; // Import icon for dropdown arrow


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
  monthlyHours: number;
}

const ProjectHeader = ({ project, selectedMonth, onMonthChange, monthlyHours }: ProjectHeaderProps) => {
  // Generate last 6 months options (current month + 5 previous months)
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMM yyyy') // Using MMM for short month names (Jan, Feb, etc.)
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
        <div className="bg-white border border-gray-200 rounded-md shadow-sm">
          <Select
  value={selectedMonth}
  onValueChange={onMonthChange}
>
  {/* Custom Trigger to match the image */}
  <SelectTrigger className="w-24 h-24 flex flex-col items-center justify-center bg-white border border-gray-300 shadow-sm rounded-lg relative text-gray-600 text-lg font-medium">
    <SelectValue>
      <div className="text-center">
        <span className="block text-xl font-bold uppercase">
          {selectedMonth ? format(new Date(selectedMonth), "MMM") : "Select"}
        </span>
        <span className="block text-gray-500 text-lg">
          {selectedMonth ? format(new Date(selectedMonth), "yyyy") : ""}
        </span>
      </div>
    </SelectValue>
    
    {/* Dropdown Arrow at the Bottom */}
    <div className="absolute bottom-2">
      <ChevronDown className="w-5 h-5 text-gray-500" />
    </div>
  </SelectTrigger>

  {/* Dropdown Content */}
  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md p-2 w-32 max-h-[250px] overflow-y-auto">
    {monthOptions.map((month) => (
      <SelectItem 
        key={month.value} 
        value={month.value} 
        className="px-4 py-2 text-gray-800 hover:bg-gray-200 rounded-md transition cursor-pointer"
      >
        <div className="text-center">
          <span className="block text-xl font-bold uppercase">{format(new Date(month.value), "MMM")}</span>
          <span className="block text-gray-500 text-lg">{format(new Date(month.value), "yyyy")}</span>
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
        </div>
        <ProjectStats 
          project={project} 
          selectedMonth={selectedMonth}
          monthlyHours={monthlyHours}
        />
      </div>
    </div>
  );
};

export default ProjectHeader;
