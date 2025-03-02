import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth, parse } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TestSubscription = () => {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // Generate month options (current month and 5 previous months)
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });
  
  // Fetch projects for the dropdown
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['test-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
        
      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error loading projects",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    }
  });
  
  // Parse dates based on selected month
  const selectedDate = parse(selectedMonth, 'yyyy-MM', new Date());
  const startDate = startOfMonth(selectedDate);
  const endDate = endOfMonth(selectedDate);
  const currentDate = new Date();
  const isCurrentMonth = isSameMonth(selectedDate, currentDate);
  
  // Fetch subscription data when project is selected
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['test-subscription', selectedProjectId, selectedMonth],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      
      console.log('Fetching data for project:', selectedProjectId, 'Month:', selectedMonth);
      
      // 1. Get current subscription data directly 
      // This will be used for both current and past months
      const { data: subscriptionDetails, error: subscriptionError } = await supabase
        .from('project_subscriptions')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (subscriptionError) {
        console.error('Error fetching subscription details:', subscriptionError);
      }
      
      console.log('Subscription details from DB:', subscriptionDetails);

      // Get basic project data
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          client_admin:client_admins(id, business_name),
          status:task_statuses(name, color_hex)
        `)
        .eq('id', selectedProjectId)
        .single();
        
      if (projectError) {
        console.error('Error fetching project:', projectError);
        toast({
          title: "Error loading project",
          description: projectError.message,
          variant: "destructive",
        });
        throw projectError;
      }
      
      // 2. Prepare response object with actual subscription details
      const result = {
        projectData,
        subscriptionData: {
          hours_spent: 0,
          hours_allotted: subscriptionDetails?.hours_allotted || 0,
          data_source: "unknown",
          subscription_status: subscriptionDetails?.subscription_status || "unknown",
          next_renewal_date: subscriptionDetails?.next_renewal_date || null,
          billing_cycle: subscriptionDetails?.billing_cycle || null,
          start_date: subscriptionDetails?.start_date || null,
          auto_renew: subscriptionDetails?.auto_renew !== undefined ? subscriptionDetails.auto_renew : false,
          max_concurrent_tasks: subscriptionDetails?.max_concurrent_tasks || 1
        },
        rawData: {
          tasks: [],
          query: {
            project_id: selectedProjectId,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
          }
        }
      };
      
      // 3. For past months, ONLY check subscription_usage table
      if (!isCurrentMonth) {
        console.log('Looking for historical data for', selectedMonth);
        
        const { data: usageData, error: usageError } = await supabase
          .from('subscription_usage')
          .select('*')
          .eq('project_id', selectedProjectId)
          .eq('month_year', selectedMonth)
          .maybeSingle();
          
        if (usageError) {
          console.error('Error fetching historical usage data:', usageError);
        }
        
        if (usageData) {
          console.log('Found historical usage data:', usageData);
          result.subscriptionData.hours_spent = usageData.hours_spent || 0;
          result.subscriptionData.hours_allotted = usageData.hours_allotted || 0;
          result.subscriptionData.data_source = "historical";
          
          // No task data for historical months
          result.rawData.tasks = [];
        } else {
          // No historical data found
          console.log('No historical data found for month:', selectedMonth);
          result.subscriptionData.data_source = "no data";
        }
        
        return result;
      } 
      
      // 4. For current month, calculate from tasks
      console.log('Calculating live data for current month');
      
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('actual_hours_spent')
        .eq('project_id', selectedProjectId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
        
      if (tasksError) {
        console.error('Error fetching tasks data:', tasksError);
      } else if (tasksData) {
        result.subscriptionData.hours_spent = tasksData.reduce((sum, task) => 
          sum + (task.actual_hours_spent || 0), 0);
        result.subscriptionData.data_source = "live";
        console.log('Live hours calculation:', result.subscriptionData.hours_spent);
      }
      
      // 5. Fetch raw task data for current month only
      const { data: rawTaskData, error: rawTaskError } = await supabase
        .from('tasks')
        .select('id, details, actual_hours_spent, created_at')
        .eq('project_id', selectedProjectId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (rawTaskError) {
        console.error('Error in raw task query:', rawTaskError);
      } else {
        result.rawData.tasks = rawTaskData || [];
      }
      
      return result;
    },
    enabled: !!selectedProjectId,
  });
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Subscription Data Test Page</h1>
      
      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Parameters</CardTitle>
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
                  ) : (
                    projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
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
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {selectedProjectId && subscriptionData && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Subscription Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Project Name</p>
                    <p className="text-md">{subscriptionData.projectData.name}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Month</p>
                    <p className="text-md">{format(selectedDate, 'MMMM yyyy')}</p>
                  </div>
                  
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <p className="text-sm font-medium">Data Source</p>
                    <div className="flex items-center">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        subscriptionData.subscriptionData.data_source === "historical" 
                          ? "bg-blue-500" 
                          : subscriptionData.subscriptionData.data_source === "live"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                      }`}></span>
                      <p className="text-md capitalize">{subscriptionData.subscriptionData.data_source}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Hours Usage</p>
                    <p className="text-md">
                      {subscriptionData.subscriptionData.data_source === "no data" 
                        ? "No data available" 
                        : `${subscriptionData.subscriptionData.hours_spent.toFixed(1)} / ${subscriptionData.subscriptionData.hours_allotted} hours`
                      }
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Subscription Status</p>
                    <p className="text-md capitalize">{subscriptionData.subscriptionData.subscription_status}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Billing Cycle</p>
                    <p className="text-md capitalize">{subscriptionData.subscriptionData.billing_cycle || "Not set"}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Next Renewal Date</p>
                    <p className="text-md">
                      {subscriptionData.subscriptionData.next_renewal_date 
                        ? new Date(subscriptionData.subscriptionData.next_renewal_date).toLocaleDateString() 
                        : "Not set"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-md">
                      {subscriptionData.subscriptionData.start_date
                        ? new Date(subscriptionData.subscriptionData.start_date).toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Auto Renew</p>
                    <p className="text-md">{subscriptionData.subscriptionData.auto_renew ? "Yes" : "No"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {isCurrentMonth && (
              <Card>
                <CardHeader>
                  <CardTitle>Raw Task Data (Current Month Only)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Query Parameters</h3>
                    <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                      {JSON.stringify(subscriptionData.rawData.query, null, 2)}
                    </pre>
                  </div>
                  
                  <h3 className="font-medium mb-2">Tasks in Date Range</h3>
                  {subscriptionData.rawData.tasks.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead>Hours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptionData.rawData.tasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell className="font-mono text-xs">{task.id}</TableCell>
                            <TableCell>{task.details}</TableCell>
                            <TableCell>{new Date(task.created_at).toLocaleString()}</TableCell>
                            <TableCell>{task.actual_hours_spent || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded">
                      <AlertCircle size={16} />
                      <span>No tasks found in this date range</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TestSubscription;
