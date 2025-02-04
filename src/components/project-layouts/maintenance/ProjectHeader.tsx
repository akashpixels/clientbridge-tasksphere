import { Tables } from "@/integrations/supabase/types";
import ProjectStats from "./ProjectStats";
import { format, subMonths } from "date-fns";
import { useState } from "react";

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
      value: format(date, 'yyyy-MM'), // Format for internal value
      label: format(date, 'MMM yyyy') // Display as "Jan 2025"
    };
  });

  return (
    <div className="flex items-center justify-between w-full gap-4">
      
      {/* Left: Project Details */}
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
            {project.client?.user_profiles 
              ? `${project.client.user_profiles.first_name} ${project.client.user_profiles.last_name}` 
              : 'No Client'}
          </p>
        </div>
      </div>

      {/* Right: Calendar-Like Month Selection */}
      <div className="flex flex-col gap-6">
        
        {/* Month Grid */}
        <div className="grid grid-cols-3 gap-3 p-2 bg-[#fcfcfc] border border-gray-200 rounded-lg shadow-md">
          {monthOptions.map((month) => (
            <button
              key={month.value}
              className={`w-20 h-24 flex flex-col items-center justify-center border rounded-lg transition-all
                ${selectedMonth === month.value ? "bg-gray-800 text-white font-semibold" : "bg-white text-gray-600"}
                hover:bg-gray-300`}
              onClick={() => onMonthChange(month.value)}
            >
              <span className="text-lg">{month.label.split(" ")[0]}</span>
              <span className="text-sm">{month.label.split(" ")[1]}</span>
            </button>
          ))}
        </div>

        {/* Project Stats */}
        <ProjectStats project={project} selectedMonth={selectedMonth} />
      </div>

    </div>
  );
};

export default ProjectHeader;
