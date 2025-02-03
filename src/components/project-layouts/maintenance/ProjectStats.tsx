import { Tables } from "@/integrations/supabase/types";

interface ProjectStatsProps {
  project: Tables<"projects">;
}

const ProjectStats = ({ project }: ProjectStatsProps) => {
  const hoursPercentage = Math.min(Math.round((project.hours_spent / project.hours_allotted) * 100), 100);

  return (
    <div className="flex gap-6">
      {/* Subscription Status Card */}
      <div className="bg-white rounded-[6px] p-4 border border-gray-100 min-w-[280px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">Subscription</span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
            project.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {project.subscription_status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500">Renews on 1st April</p>
          <p className="text-xs font-medium text-gray-600">Billing Cycle: Monthly</p>
        </div>
      </div>

      {/* Hours Progress Card */}
      <div className="bg-white rounded-[6px] p-4 border border-gray-100 min-w-[280px]">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Hours Used</span>
            <span className="text-sm font-semibold">{hoursPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                hoursPercentage > 90 ? 'bg-red-500' :
                hoursPercentage > 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${hoursPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {project.hours_spent} / {project.hours_allotted} hrs
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectStats;