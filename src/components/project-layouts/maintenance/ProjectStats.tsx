import { Tables } from "@/integrations/supabase/types";
import { differenceInDays } from "date-fns";
import { useState } from "react";

interface ProjectStatsProps {
  project: Tables<"projects"> & {
    project_subscriptions?: {
      hours_allotted: number;
      subscription_status: string;
      next_renewal_date: string;
    }[];
  };
  selectedMonth: string;
  monthlyHours: number;
}

const ProjectStats = ({ project, selectedMonth, monthlyHours }: ProjectStatsProps) => {
  const [hovered, setHovered] = useState(false);

  const subscription = project.project_subscriptions?.[0];
  const hoursAllotted = subscription?.hours_allotted || 0;

  const hoursPercentage = Math.min(
    Math.round((monthlyHours / hoursAllotted) * 100),
    100
  );

  // Renewal Status Logic
  const renewalDate = subscription?.next_renewal_date ? new Date(subscription.next_renewal_date) : new Date();
  const daysUntilRenewal = differenceInDays(renewalDate, new Date());

  let statusColor = "bg-green-600"; // Default Active (Green)
  let statusText = "Active";

  if (daysUntilRenewal <= 5 && daysUntilRenewal > 0) {
    statusColor = "bg-orange-500"; // Warning (Orange)
    statusText = "Renew Soon";
  } else if (subscription?.subscription_status !== "active") {
    statusColor = "bg-red-600"; // Inactive (Red)
    statusText = "Inactive";
  }

  return (
    <div className="flex gap-6">

  {/* Hours Progress Card */}
      <div className="border border-gray-200 rounded-lg p-4 min-w-[280px] bg-[#fcfcfc]">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Hours Spent</span>
          <span className="text-sm font-bold">{hoursPercentage}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
          <div
            className={`h-2.5 rounded-full ${
              hoursPercentage > 90
                ? "bg-red-600"
                : hoursPercentage > 70
                ? "bg-yellow-600"
                : "bg-green-600"
            }`}
            style={{ width: `${hoursPercentage}%` }}
          />
        </div>
        <p className="text-lg text-gray-500 text-center mt-2">
          {monthlyHours?.toFixed(1) || "0"} / {hoursAllotted}
        </p>
      </div>


      
   {/* Subscription Status Card */}
<div className="relative w-[108px] h-[108px] border border-gray-200 rounded-lg flex flex-col items-center justify-center bg-[#fcfcfc]">
  {/* Status Dot in Top-Right Corner */}
  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${statusColor}`} />

  {/* Days Until Renewal */}
  <p className="text-[10px] text-gray-500">Renews in</p>
  <p className="text-xl font-semibold">
    {daysUntilRenewal > 0 ? `${daysUntilRenewal} Days` : "Expired"}
  </p>
  <p className="text-[10px] text-gray-400">Cycle: Monthly</p>
</div>


    
    </div>
  );
};

export default ProjectStats;
