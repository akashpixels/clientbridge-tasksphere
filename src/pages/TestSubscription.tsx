
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, InfoCircle } from "lucide-react";
import { Link } from "react-router-dom";

const TestSubscription = () => {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Generate month options (current + 5 previous months)
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });
  
  // Calculate date ranges based on selected month
  const selectedDate = new Date(selectedMonth);
  const startDate = startOfMonth(selectedDate);
  const endDate = endOfMonth(selectedDate);
  const currentDate = new Date();
  const isCurrentMonth = isSameMonth(selectedDate, currentDate);
  
  // Fetch available projects for testing
  const { data: projects } = useQuery({
    queryKey: ['test-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .limit(10);
        
      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error loading projects",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data || [];
    },
  });
  
  // Set the first project as default when projects are loaded
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);
  
  // Query for subscription data
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['test-subscription', selectedProjectId, selectedMonth],
    enabled: !!selectedProjectId,
    queryFn: async () => {
      if (!selectedProjectId) return null;
      
      console.log(`Fetching data for project ${selectedProjectId}, month ${selectedMonth}`);
      
      // 1. Fetch base project subscription data
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          project_subscriptions(
            id,
            subscription_status,
            hours_allotted,
            next_renewal_date
          )
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
      
      console.log('Basic project data fetched:', projectData);
      
      // Initialize result object
      const result = {
        projectName: projectData.name,
        projectId: projectData.id,
        subscriptionStatus: projectData.project_subscriptions?.[0]?.subscription_status || 'unknown',
        nextRenewalDate: projectData.project_subscriptions?.[0]?.next_renewal_date || 'N/A',
        hoursAllotted: projectData.project_subscriptions?.[0]?.hours_allotted || 0,
        hoursSpent: 0,
        dataSource: "unknown",
        rawTasksData: null,
        rawUsageData: null,
        tasksQuery: "",
        usageQuery: "",
      };
      
      // Logic for current month vs historical data
      if (isCurrentMonth) {
        // Current month: Calculate from tasks
        console.log('Getting current month data from tasks');
        result.dataSource = "live";
        
        const tasksQuery = supabase
          .from('tasks')
          .select('id, actual_hours_spent')
          .eq('project_id', selectedProjectId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
          
        result.tasksQuery = tasksQuery.toJSON();
        
        const { data: tasksData, error: tasksError } = await tasksQuery;
        
        if (tasksError) {
          console.error('Error fetching tasks data:', tasksError);
        } else {
          // Calculate total hours spent from tasks
          result.hoursSpent = tasksData ? 
            tasksData.reduce((sum, task) => sum + (task.actual_hours_spent || 0), 0) : 
            0;
          
          result.rawTasksData = tasksData;
          console.log('Calculated live hours:', result.hoursSpent);
        }
      } else {
        // Past month: Check subscription_usage
        console.log('Getting historical data for month:', selectedMonth);
        
        const usageQuery = supabase
          .from('subscription_usage')
          .select('*')
          .eq('project_id', selectedProjectId)
          .eq('month_year', selectedMonth);
          
        result.usageQuery = usageQuery.toJSON();
        
        const { data: usageData, error: usageError } = await usageQuery.maybeSingle();
        
        if (usageError) {
          console.error('Error fetching historical usage data:', usageError);
        }
        
        // If we found historical data, use it
        if (usageData) {
          console.log('Found historical usage data:', usageData);
          result.hoursSpent = usageData.hours_spent || 0;
          result.hoursAllotted = usageData.hours_allotted || result.hoursAllotted;
          result.dataSource = "historical";
          result.rawUsageData = usageData;
        } else {
          // No historical data found
          console.log('No historical data found for month:', selectedMonth);
          result.hoursSpent = 0;
          result.dataSource = "no data";
        }
      }
      
      return result;
    },
  });
  
  // Calculate usage percentage
  const usagePercentage = subscriptionData && subscriptionData.hoursAllotted > 0 
    ? Math.min(Math.round((subscriptionData.hoursSpent / subscriptionData.hoursAllotted) * 100), 100)
    : 0;
    
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/projects">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Subscription Data Test Page</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Project</label>
              <Select
                value={selectedProjectId || ""}
                onValueChange={(value) => setSelectedProjectId(value)}
                disabled={!projects || projects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Select Month</label>
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label} {month.value === format(new Date(), 'yyyy-MM') && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {isLoadingSubscription ? (
          <Card>
            <CardContent className="p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading subscription data...</p>
              </div>
            </CardContent>
          </Card>
        ) : subscriptionData ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Subscription Status</span>
                <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {isCurrentMonth ? "Current Month" : "Historical"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-semibold">{subscriptionData.subscriptionStatus}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Next Renewal</p>
                  <p className="font-semibold">{subscriptionData.nextRenewalDate}</p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Hours Usage</span>
                  <span className="text-sm">
                    {subscriptionData.hoursSpent.toFixed(1)} / {subscriptionData.hoursAllotted.toFixed(1)}
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>
              
              <div className="bg-blue-50 p-3 rounded flex items-start gap-2">
                <InfoCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-700">Data Source: {subscriptionData.dataSource}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {subscriptionData.dataSource === "live" 
                      ? "Data calculated from active tasks for current month" 
                      : subscriptionData.dataSource === "historical" 
                        ? "Data from historical usage records" 
                        : "No historical data found for this month"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">Select a project to view subscription data</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Debug Information Section */}
      {subscriptionData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Query Parameters</h3>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                  <p>Project ID: {selectedProjectId}</p>
                  <p>Month: {selectedMonth}</p>
                  <p>Is Current Month: {isCurrentMonth.toString()}</p>
                  <p>Date Range: {startDate.toISOString()} to {endDate.toISOString()}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Data Overview</h3>
                <div className="bg-gray-50 p-3 rounded text-xs">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="pr-2 py-1 font-medium">Hours Spent:</td>
                        <td>{subscriptionData.hoursSpent}</td>
                      </tr>
                      <tr>
                        <td className="pr-2 py-1 font-medium">Hours Allotted:</td>
                        <td>{subscriptionData.hoursAllotted}</td>
                      </tr>
                      <tr>
                        <td className="pr-2 py-1 font-medium">Data Source:</td>
                        <td>{subscriptionData.dataSource}</td>
                      </tr>
                      <tr>
                        <td className="pr-2 py-1 font-medium">Usage %:</td>
                        <td>{usagePercentage}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Raw Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isCurrentMonth && (
                  <div>
                    <h4 className="text-xs font-medium mb-1">Tasks Data</h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs font-mono overflow-auto max-h-60">
                      {JSON.stringify(subscriptionData.rawTasksData, null, 2)}
                    </pre>
                  </div>
                )}
                
                {!isCurrentMonth && (
                  <div>
                    <h4 className="text-xs font-medium mb-1">Usage Data</h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs font-mono overflow-auto max-h-60">
                      {JSON.stringify(subscriptionData.rawUsageData, null, 2)}
                    </pre>
                  </div>
                )}
                
                <div>
                  <h4 className="text-xs font-medium mb-1">Query Used</h4>
                  <pre className="bg-gray-50 p-3 rounded text-xs font-mono overflow-auto max-h-60">
                    {isCurrentMonth 
                      ? JSON.stringify(JSON.parse(subscriptionData.tasksQuery), null, 2)
                      : JSON.stringify(JSON.parse(subscriptionData.usageQuery), null, 2)
                    }
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestSubscription;
