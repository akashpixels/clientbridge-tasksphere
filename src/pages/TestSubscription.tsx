import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Example UI components (replace with your own)
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  format,
  subMonths,
  parse,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { useToast } from "@/hooks/use-toast";

const MinimalSubscriptionPage: React.FC = () => {
  const { toast } = useToast();

  // State for selected project and month
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  // Generate month options (current month and 5 previous)
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    };
  });

  // 1) Fetch list of projects
  const {
    data: projects,
    isLoading: projectsLoading,
    isError: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");
      if (error) {
        toast({
          title: "Error loading projects",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      return data || [];
    },
  });

  // Parse the selected month into a JS Date
  const parsedMonth = parse(selectedMonth, "yyyy-MM", new Date());
  const monthStart = startOfMonth(parsedMonth);
  const monthEnd = endOfMonth(parsedMonth);

  // 2) Fetch usage data from usage_view + subscription data from project_subscriptions
  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    isError: subscriptionError,
  } = useQuery({
    queryKey: ["subscriptionData", selectedProjectId, selectedMonth],
    queryFn: async () => {
      if (!selectedProjectId) return null;

      // (A) Get usage data from usage_view
      const { data: usageData, error: usageError } = await supabase
        .from("usage_view")
        .select("*")
        .eq("project_id", selectedProjectId)
        .eq("month_year", selectedMonth)
        .maybeSingle();
      if (usageError) {
        toast({
          title: "Error loading usage data",
          description: usageError.message,
          variant: "destructive",
        });
      }

      // (B) Get subscription details (latest entry)
      const { data: subDetails, error: subError } = await supabase
        .from("project_subscriptions")
        .select("*")
        .eq("project_id", selectedProjectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (subError) {
        toast({
          title: "Error loading subscription",
          description: subError.message,
          variant: "destructive",
        });
      }

      // Merge the two sets of data
      return {
        usageData,
        subscription: subDetails,
      };
    },
    enabled: !!selectedProjectId,
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Minimal Subscription Page</h1>

      {/* --- Selection Controls --- */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Project & Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project</label>
            <Select
              value={selectedProjectId || ""}
              onValueChange={(value) => setSelectedProjectId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projectsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading projects...
                  </SelectItem>
                ) : projectsError ? (
                  <SelectItem value="error" disabled>
                    Error loading projects
                  </SelectItem>
                ) : (
                  projects?.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <Select
              value={selectedMonth}
              onValueChange={(value) => setSelectedMonth(value)}
              disabled={!selectedProjectId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* --- Display subscription info --- */}
      {selectedProjectId && subscriptionData && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription & Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionLoading && <p>Loading subscription data...</p>}
            {subscriptionError && (
              <p className="text-red-600">Error loading subscription data</p>
            )}

            {!subscriptionLoading && subscriptionData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subscription fields from project_subscriptions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Subscription Status</p>
                  <p className="text-md">
                    {subscriptionData.subscription?.subscription_status ?? "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Billing Cycle</p>
                  <p className="text-md">
                    {subscriptionData.subscription?.billing_cycle ?? "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Next Renewal Date</p>
                  <p className="text-md">
                    {subscriptionData.subscription?.next_renewal_date
                      ? new Date(subscriptionData.subscription.next_renewal_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="text-md">
                    {subscriptionData.subscription?.start_date
                      ? new Date(subscriptionData.subscription.start_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>

                {/* Usage fields from usage_view */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Hours Allotted</p>
                  <p className="text-md">
                    {subscriptionData.usageData?.hours_allotted ?? 0}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Hours Spent</p>
                  <p className="text-md">
                    {subscriptionData.usageData?.hours_spent ?? 0}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MinimalSubscriptionPage;
