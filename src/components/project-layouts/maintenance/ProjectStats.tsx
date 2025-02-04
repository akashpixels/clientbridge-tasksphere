import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

interface ProjectStatsProps {
  project: Tables<"projects">;
  selectedMonth: string;
}

const ProjectStats = ({ project, selectedMonth }: ProjectStatsProps) => {
  const { data: monthlyHours } = useQuery({
    queryKey: ['monthlyHours', project.id, selectedMonth],
    queryFn: async () => {
      const startDate = startOfMonth(new Date(selectedMonth));
      const endDate = endOfMonth(new Date(selectedMonth));
      
      const { data, error } = await supabase
        .from('tasks')
        .select('actual_hours_spent')
        .eq('project_id', project.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;
      
      const totalHours = data.reduce((sum, task) => sum + (task.actual_hours_spent || 0), 0);
      return totalHours;
    },
  });

  const hoursPercentage = Math.min(Math.round((monthlyHours || 0 / project.hours_allotted) * 100), 100);

  return (
    <div className="flex gap-6">
      {/* Subscription Status Card */}
      <div className="glass-card backdrop-blur-sm rounded-lg p-4 min-w-[280px] hover-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Subscription</span>
          <span className={inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${
            project.subscription_status === 'active' ? 'bg-[#F2FCE2] text-[#2E7D32]' : 'bg-gray-600 text-white'
          }}>
            {project.subscription_status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium">Renews on 1st April</p>
          <p className="text-xs text-gray-500 font-medium">Billing Cycle: Monthly</p>
        </div>
      </div>

      {/* Hours Progress Card */}
      <div className="glass-card backdrop-blur-sm rounded-lg p-4 min-w-[280px] hover-card">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Hours Used (This Month)</span>
            <span className="text-sm font-bold">{hoursPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div 
              className={h-2.5 rounded-full ${
                hoursPercentage > 90 ? 'bg-red-600' :
                hoursPercentage > 70 ? 'bg-yellow-600' :
                'bg-green-600'
              }}
              style={{ width: ${hoursPercentage}% }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {monthlyHours?.toFixed(1) || '0'} / {project.hours_allotted} hrs
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectStats;
