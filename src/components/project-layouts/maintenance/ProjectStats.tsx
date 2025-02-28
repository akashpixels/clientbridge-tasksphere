
import { Tables } from "@/integrations/supabase/types";
import { differenceInDays } from "date-fns";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
  
  // Direct subscription query to bypass any data access issues
  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['subscription-direct', project.id],
    queryFn: async () => {
      console.log('Directly fetching subscription data for project:', project.id);
      
      const { data, error } = await supabase
        .from('project_subscriptions')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching subscription directly:', error);
        return null;
      }
      
      console.log('Direct subscription data:', data);
      return data;
    },
  });

  // For debugging
  useEffect(() => {
    console.log('ProjectStats rendered with project:', project);
    console.log('Project subscriptions from props:', project.project_subscriptions);
    console.log('Monthly hours:', monthlyHours);
    console.log('Subscription data from direct query:', subscriptionData);
  }, [project, monthlyHours, subscriptionData]);

  // Get subscription data from either direct query or props
  const subscription = subscriptionData || project.project_subscriptions?.[0];
  
  // Default values to prevent UI errors
  const hoursAllotted = subscription?.hours_allotted || 0;
  const hoursSpent = subscription?.hours_spent || 0;
  
  // Use the direct hours value if available, otherwise use the monthly calculation
  const displayedHours = typeof hoursSpent === 'number' ? 
    hoursSpent : (monthlyHours || 0);

  const hoursPercentage = hoursAllotted ? 
    Math.min(Math.round((displayedHours / hoursAllotted) * 100), 100) : 0;

  // Renewal Status Logic.
  const renewalDate = subscription?.next_renewal_date ? 
    new Date(subscription.next_renewal_date) : new Date();
  
  const daysUntilRenewal = differenceInDays(renewalDate, new Date());

  let statusColor = "bg-green-600"; // Default Active (Green)
  let statusText = "Active";

  if (daysUntilRenewal <= 5 && daysUntilRenewal > 0) {
    statusColor = "bg-orange-500"; // Warning (Orange)
    statusText = "Renew Soon";
  } else if (daysUntilRenewal <= 0) {
    statusColor = "bg-red-600"; // Expired (Red)
    statusText = "Expired";
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
          background: `linear-gradient(to right, #fcfcfc ${hoursPercentage}%, transparent ${hoursPercentage}%)`,
          transition: "background 0.5s ease"
        }}
      >
        {/* Hours Label */}
        <p className="text-[11px] font-medium text-gray-500">Hours Used</p>

        {/* Percentage Display */}
        <p className="text-xl font-semibold">
          {isLoading ? "Loading..." : `${displayedHours.toFixed(1)} / ${hoursAllotted}`}
        </p>

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
        <p className="text-[11px] text-gray-500">
          {daysUntilRenewal > 0 ? "Renews in" : "Expired"}
        </p>
        <p className="text-xl font-semibold">
          {isLoading ? "Loading..." : (daysUntilRenewal > 0 ? `${daysUntilRenewal} Days` : "Expired")}
        </p>
        <p className="text-[11px] text-gray-400">
          Cycle: {subscription?.billing_cycle || "Monthly"}
        </p>
      </div>
    
    </div>
  );
};

export default ProjectStats;
