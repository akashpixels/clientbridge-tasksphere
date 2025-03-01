
import { Tables } from "@/integrations/supabase/types";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

interface ProjectStatsProps {
  project: Tables<"projects"> & {
    client_admin: {
      id: string;
      business_name: string;
      user_profiles: {
        first_name: string;
        last_name: string;
      } | null;
    } | null;
    project_subscriptions: {
      subscription_status: string;
      hours_allotted: number;
      hours_spent: number | null;
      next_renewal_date: string;
      max_concurrent_tasks: number;
    }[];
  };
  selectedMonth: string;
  monthlyHours: number;
}

const ProjectStats = ({ project, selectedMonth, monthlyHours }: ProjectStatsProps) => {
  // Get the first subscription or use default values
  const subscription = project.project_subscriptions && project.project_subscriptions.length > 0 
    ? project.project_subscriptions[0] 
    : { hours_allotted: 0, hours_spent: 0, max_concurrent_tasks: 1 };

  console.log("ProjectStats - Subscription data:", subscription);
  
  const hoursAllotted = subscription.hours_allotted || 0;
  const hoursSpent = subscription.hours_spent || 0;
  const maxConcurrentTasks = subscription.max_concurrent_tasks || 1;
  
  // Calculate percentage safely avoiding division by zero
  const hoursPercentage = hoursAllotted > 0 
    ? Math.min(Math.round((hoursSpent / hoursAllotted) * 100), 100) 
    : 0;

  return (
    <div className="flex gap-4">
      <div className="bg-[#fcfcfc] border border-gray-200 rounded-[4px] p-4 w-[108px] h-[108px] flex flex-col items-center justify-center">
        <div className="text-2xl font-semibold">{maxConcurrentTasks}</div>
        <div className="text-xs text-gray-500 text-center">Max Concurrent Tasks</div>
      </div>
      
      <div className="bg-[#fcfcfc] border border-gray-200 rounded-[4px] p-4 w-[108px] h-[108px] flex flex-col items-center justify-center">
        <div style={{ width: 50, height: 50 }}>
          <CircularProgressbar
            value={hoursPercentage}
            text={`${hoursPercentage}%`}
            styles={buildStyles({
              textSize: '28px',
              pathColor: hoursPercentage > 90 ? '#ef4444' : hoursPercentage > 75 ? '#f97316' : '#22c55e',
              textColor: '#374151',
              trailColor: '#e5e7eb',
            })}
          />
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">{hoursSpent}/{hoursAllotted} hrs</div>
      </div>
    </div>
  );
};

export default ProjectStats;
