import { Tables } from "@/integrations/supabase/types";
import ProjectStats from "./ProjectStats";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths } from "date-fns";

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
  // Generate last 6 months options
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, "yyyy-MM"), // Format for value
      label: format(date, "MMM yyyy"), // Display as "Jan 2025"
    };
  });

  return (
    <div className="flex items-center justify-between w-full gap-6 p-4">
      
      {/* Left: Project Details */}
      <div className="flex items-center gap-4">
        {/* Project Logo */}
        {project.logo_url && (
          <img
            src={project.logo_url}
            alt={`${project.name} logo`}
            className="w-12 h-12 object-contain rounded-full"
          />
        )}
        {/* Project Name & Client */}
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <p className="text-gray-500">
            {project.client?.user_profiles
              ? `${project.client.user_profiles.first_name} ${project.client.user_profiles.last_name}`
              : "No Client"}
          </p>
        </div>
      </div>

      {/* Middle: Month Selection Box (Dropdown inside Square Box) */}
      <div className="relative">
        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger className="w-[80px] h-[80px] flex flex-col items-center justify-center bg-white border border-gray-300 rounded-md cursor-pointer">
            <span className="text-lg font-semibold">
              {format(new Date(selectedMonth), "MMM")}
            </span>
            <span className="text-sm text-gray-500">
              {format(new Date(selectedMonth), "yyyy")}
            </span>
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

      {/* Right: Subscription & Hours Used */}
      <div className="flex items-center gap-4">
        {/* Subscription Card */}
        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-xs text-gray-500">Subscription</p>
          <p className="text-sm text-gray-700">Renews on 1st April</p>
          <p className="text-xs text-gray-400">Billing Cycle: Monthly</p>
          <span className="px-2 py-1 mt-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
            Active
          </span>
        </div>

        {/* Hours Used Card */}
        <div className="border border-gray-200 rounded-md p-3">
          <p className="text-xs text-gray-500">Hours Used (This Month)</p>
          <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-red-500" style={{ width: "100%" }}></div>
          </div>
          <p className="text-sm text-gray-700 mt-1">3.4 / 40 hrs</p>
        </div>
      </div>

    </div>
  );
};

export default ProjectHeader;
