import { Tables } from "@/integrations/supabase/types";

interface ProjectStatsProps {
  project: Tables<"projects">;
}

const ProjectStats = ({ project }: ProjectStatsProps) => {
  const hoursPercentage = Math.min(Math.round((project.hours_spent / project.hours_allotted) * 100), 100);

  return (
    <div className="flex gap-6">
      {/* Subscription Status Card */}
      <div className="glass-card backdrop-blur-sm bg-[#fcfcfc] rounded-lg p-4 min-w-[280px] hover-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Subscription</span>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${
            project.subscription_status === 'active' ? 'bg-[#F2FCE2] text-[#2E7D32]' : 'bg-gray-600 text-white'
          }`}>
            {project.subscription_status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium">Renews on 1st April</p>
          <p className="text-xs text-gray-500 font-medium">Billing Cycle: Monthly</p>
        </div>
      </div>

      {/* Hours Progress Card */}
      <div className="glass-card backdrop-blur-sm bg-[#fcfcfc] rounded-lg p-4 min-w-[280px] hover-card">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Hours Used</span>
            <span className="text-sm font-bold">{hoursPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                hoursPercentage > 90 ? 'bg-red-600' :
                hoursPercentage > 70 ? 'bg-yellow-600' :
                'bg-green-600'
              }`}
              style={{ width: `${hoursPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {project.hours_spent.toFixed(1)} / {project.hours_allotted} hrs
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectStats;