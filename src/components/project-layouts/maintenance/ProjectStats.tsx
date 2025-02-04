import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { useState } from "react";

interface ProjectStatsProps {
  project: Tables<"projects">;
  selectedMonth: string;
}

const ProjectStats = ({ project, selectedMonth }: ProjectStatsProps) => {
  const [hovered, setHovered] = useState(false);

  // Fetch Monthly Hours Used
  const { data: monthlyHours } = useQuery({
    queryKey: ["monthlyHours", project.id, selectedMonth],
    queryFn: async () => {
      const startDate = startOfMonth(new Date(selectedMonth));
      const endDate = endOfMonth(new Date(selectedMonth));

      const { data, error } = await supabase
        .from("tasks")
        .select("actual_hours_spent")
        .eq("project_id", project.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;

      return data.reduce((sum, task) => sum + (task.actual_hours_spent || 0), 0);
    },
  });

  const hoursPercentage = Math.min(
    Math.round(((monthlyHours || 0) / project.hours_allotted) * 100),
    100
  );

  // Renewal Status Logic
  const renewalDate = new Date("2024-04-01"); // Replace with dynamic renewal date
  const daysUntilRenewal = differenceInDays(renewalDate, new Date());

  let statusColor = "bg-green-600"; // Default Active (Green)
  let statusText = "Active";

  if (daysUntilRenewal <= 5 && daysUntilRenewal > 0) {
    statusColor = "bg-orange-500"; // Warning (Orange)
    statusText = "Renew Soon";
  } else if (project.subscription_status !== "active") {
    statusColor = "bg-red-600"; // Inactive (Red)
    statusText = "Inactive";
  }

  return (
    <div className="flex gap-6">
      {/* Subscription Status Card */}
      <div className="border border-gray-200 rounded-lg p-4 min-w-[280px] flex items-center justify-between bg-[#fcfcfc]">
        <div>
          <p className="text-xs text-gray-500">Renews in</p>
          <p className="text-2xl font-semibold">
            {daysUntilRenewal > 0 ? `${daysUntilRenewal} Days` : "Expired"}
          </p>
          <p className="text-xs text-gray-400">Cycle : Monthly</p>
        </div>

        {/* Status Dot with Tooltip */}
        <div
          className="relative flex items-center"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className={`w-3 h-3 rounded-full ${statusColor}`} />
          {hovered && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded-md">
              {statusText}
            </div>
          )}
        </div>
      </div>

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
          {monthlyHours?.toFixed(1) || "0"} / {project.hours_allotted}
        </p>
      </div>
    </div>
  );
};

export default ProjectStats;