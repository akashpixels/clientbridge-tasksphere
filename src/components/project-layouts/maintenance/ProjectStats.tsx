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
    <div className="flex gap-4">

{/* Hours Progress Card */}
<div 
  className="relative w-[160px] h-[108px] border border-gray-200 rounded-lg flex flex-col justify-center items-center gap-2 overflow-hidden text-gray-900"
  style={{
    background: `#fcfcfc`
  }}
>
  {/* Progress Zig-Zag Overlay */}
  <div 
    className="absolute top-0 left-0 h-full"
    style={{
      width: `${hoursPercentage}%`,
      background: "#333333",
      maskImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 10\"><path d=\"M0,5 L5,0 L10,5 L15,0 L20,5 L25,0 L30,5 L35,0 L40,5 L45,0 L50,5 L55,0 L60,5 L65,0 L70,5 L75,0 L80,5 L85,0 L90,5 L95,0 L100,5 V10 H0 Z\" fill=\"white\"/></svg>')",
      WebkitMaskImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 10\"><path d=\"M0,5 L5,0 L10,5 L15,0 L20,5 L25,0 L30,5 L35,0 L40,5 L45,0 L50,5 L55,0 L60,5 L65,0 L70,5 L75,0 L80,5 L85,0 L90,5 L95,0 L100,5 V10 H0 Z\" fill=\"white\"/></svg>')",
      transition: "width 0.5s ease"
    }}
  />
  {/* Hours Label */}
  <p className="text-[11px] font-medium">Hours Used</p>

  {/* Percentage Display */}
  <p className="text-xl font-semibold">{monthlyHours?.toFixed(1) || "0"} / {hoursAllotted}</p>

  {/* Hours Spent & Total */}
  <p className="text-[11px]">{hoursPercentage}%</p>
</div>




      
 {/* Subscription Status Card */}
<div className="relative w-[108px] h-[108px] border border-gray-200 rounded-lg flex flex-col items-center justify-center bg-[#fcfcfc] space-y-1">
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
  <p className="text-xl font-semibold">{daysUntilRenewal > 0 ? `${daysUntilRenewal} Days` : "Expired"}</p>
  <p className="text-[11px] text-gray-400">Cycle: Monthly</p>
</div>



    
    </div>
  );
};

export default ProjectStats;
