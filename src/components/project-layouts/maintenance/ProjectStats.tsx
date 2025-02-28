
import { Tables } from "@/integrations/supabase/types";
import { differenceInDays, format } from "date-fns";
import { useState } from "react";

interface ProjectStatsProps {
  project: Tables<"projects"> & {
    project_subscriptions?: {
      hours_allotted: number;
      hours_spent: number | null;
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
    Math.round((monthlyHours / hoursAllotted) * 100) || 0,
    100
  );

  // Renewal Status Logic
  const renewalDate = subscription?.next_renewal_date ? new Date(subscription.next_renewal_date) : new Date();
  const currentDate = new Date();
  const daysUntilRenewal = differenceInDays(renewalDate, currentDate);

  console.log("Subscription status:", subscription?.subscription_status);
  console.log("Next renewal date:", renewalDate);
  console.log("Days until renewal:", daysUntilRenewal);

  let statusColor = "bg-green-600"; // Default Active (Green)
  let statusText = "Active";

  // Check subscription status first - this should take precedence
  if (subscription?.subscription_status !== "active") {
    statusColor = "bg-red-600"; // Inactive (Red)
    statusText = "Inactive";
  } 
  // Then check renewal date
  else if (daysUntilRenewal <= 5 && daysUntilRenewal > 0) {
    statusColor = "bg-orange-500"; // Warning (Orange)
    statusText = "Renew Soon";
  }
  // Check if the date is in the past
  else if (daysUntilRenewal < 0) {
    statusColor = "bg-red-600"; // Expired (Red)
    statusText = "Renewal Overdue";
  }

  const formattedRenewalDate = format(renewalDate, 'MMM yyyy');

  return (
    <div className="flex gap-4">
      
     {/* Hours Progress Card */}
      <div 
        className="relative w-[160px] h-[108px] border border-gray-200 rounded-lg flex flex-col justify-center items-center gap-2 overflow-hidden text-gray-900"
        style={{
          background: `linear-gradient(to right, #fcfcfc ${hoursPercentage}%, transparent ${hoursPercentage}%)`,
          transition: "background 0.5s ease"
        }}
      >
        {/* Hours Label */}
        <p className="text-[11px] font-medium text-gray-500">Hours Used</p>

        {/* Percentage Display */}
        <p className="text-xl font-semibold">{monthlyHours?.toFixed(1) || "0"} / {hoursAllotted}</p>

        {/* Hours Spent & Total */}
        <p className="text-[11px] text-gray-400">{hoursPercentage}%</p>
      </div>

      {/* Subscription Status Card */}
      <div className="relative w-[108px] h-[108px] border border-gray-200 rounded-lg flex flex-col items-center justify-center bg-[#fcfcfc] gap-2">
        
        {/* Status Dot with Tooltip (Top-Right) */}
        <div
          className="absolute top-2 right-2"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Status Indicator Dot */}
          <div className={`w-3 h-3 rounded-full ${statusColor}`} />

          {/* Tooltip Appears on Hover */}
          {hovered && (
            <div className="absolute top-[-28px] right-1/2 translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
              {statusText}
            </div>
          )}
        </div>

        {/* Subscription Info (Centered) */}
        <p className="text-[11px] text-gray-500">Renews in</p>
        <p className="text-xl font-semibold">
          {daysUntilRenewal > 0 
            ? `${daysUntilRenewal} Days` 
            : (subscription?.subscription_status === "active" ? "Renewal Overdue" : "Expired")}
        </p>
        <p className="text-[11px] text-gray-400">Cycle: Monthly</p>
      </div>
    
    </div>
  );
};

export default ProjectStats;
