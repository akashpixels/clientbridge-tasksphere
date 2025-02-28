
import { useState } from "react";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import ProjectStats from "./ProjectStats";

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
    status: {
      name: string;
      color_hex: string | null;
    } | null;
    project_subscriptions?: {
      id: string;
      subscription_status: string;
      hours_allotted: number;
      hours_spent: number | null;
      next_renewal_date: string;
      billing_cycle: string;
    }[];
  };
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  monthlyHours: number;
}

const ProjectHeader = ({ 
  project, 
  selectedMonth, 
  onMonthChange,
  monthlyHours
}: ProjectHeaderProps) => {
  const [showMonthSelector, setShowMonthSelector] = useState(false);

  // Generate last 12 months for selection
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const formattedDate = format(date, 'yyyy-MM');
      const displayDate = format(date, 'MMMM yyyy');
      options.push({ value: formattedDate, label: displayDate });
    }
    return options;
  };

  const monthOptions = getMonthOptions();
  const currentMonth = monthOptions.find(option => option.value === selectedMonth);

  // The client name can come from different places depending on the data structure
  const getClientName = () => {
    if (project.client_admin?.business_name) {
      return project.client_admin.business_name;
    }
    
    if (project.client_admin?.user_profiles?.first_name) {
      const { first_name, last_name } = project.client_admin.user_profiles;
      return `${first_name} ${last_name || ''}`;
    }
    
    return 'No Client Assigned';
  };

  console.log("ProjectHeader - Project subscriptions:", project.project_subscriptions);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <span 
              className="text-xs px-2 py-1 rounded-full"
              style={{
                backgroundColor: `${project.status?.color_hex || '#f1f5f9'}15`,
                color: project.status?.color_hex || '#64748b'
              }}
            >
              {project.status?.name || 'Status unknown'}
            </span>
          </div>
          <p className="text-gray-500 mt-1">Client: {getClientName()}</p>
        </div>
        
        <div className="relative inline-block">
          <button 
            className="px-3 py-2 border border-gray-200 rounded-md text-sm flex items-center gap-2"
            onClick={() => setShowMonthSelector(!showMonthSelector)}
          >
            {currentMonth?.label || 'Select Month'}
            <span className="w-4 h-4">▼</span>
          </button>
          
          {showMonthSelector && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {monthOptions.map(option => (
                <button
                  key={option.value}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => {
                    onMonthChange(option.value);
                    setShowMonthSelector(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
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
