
import { useEffect, useState } from "react";
import { format, parse, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertCircle } from "lucide-react";

const TestSubscription = () => {
  // State for selected project and month
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [rawData, setRawData] = useState<{
    tasks: any[] | null,
    usageData: any | null,
    subscriptionData: any | null,
    selectedDate: Date,
    isCurrentMonth: boolean,
    dataSource: string
  }>({
    tasks: null,
    usageData: null,
    subscriptionData: null,
    selectedDate: new Date(),
    isCurrentMonth: true,
    dataSource: "unknown"
  });

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        setProjects(data || []);
        if (data && data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  // Fetch subscription data when project or month changes
  useEffect(() => {
    if (!selectedProjectId) return;

    const fetchSubscriptionData = async () => {
      setLoading(true);
      
      // Parse the selected month
      const selectedDate = parse(selectedMonth, 'yyyy-MM', new Date());
      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);
      const currentDate = new Date();
      const isCurrentMonth = isSameMonth(selectedDate, currentDate);
      
      console.log('Fetching data for project:', selectedProjectId, 'Month:', selectedMonth);
      
      // 1. Get basic project data with subscription info
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
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
        setLoading(false);
        return;
      }

      let dataSource = "unknown";
      let monthlyHours = 0;
      let hoursAllotted = projectData.project_subscriptions?.[0]?.hours_allotted || 0;
      let tasksData = null;
      let usageData = null;
      
      // 2. Fetch appropriate data based on whether it's current month or past
      if (isCurrentMonth) {
        // Current month - get tasks data
        dataSource = "live";
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, name, actual_hours_spent')
          .eq('project_id', selectedProjectId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
          
        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
        } else {
          tasksData = tasks;
          // Calculate total hours from tasks
          monthlyHours = tasks ? 
            tasks.reduce((sum, task) => sum + (task.actual_hours_spent || 0), 0) : 
            0;
        }
        
        // Get the SQL query that was executed (for debugging)
        const tasksQuery = supabase
          .from('tasks')
          .select('id, name, actual_hours_spent')
          .eq('project_id', selectedProjectId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
          
        console.log('Tasks query:', JSON.stringify(tasksQuery.toJSON?.() || tasksQuery));
      } 
      else {
        // Past month - check subscription_usage
        const { data: usage, error: usageError } = await supabase
          .from('subscription_usage')
          .select('*')
          .eq('project_id', selectedProjectId)
          .eq('month_year', selectedMonth)
          .maybeSingle();
          
        if (usageError) {
          console.error('Error fetching usage data:', usageError);
        } else {
          usageData = usage;
          
          if (usage) {
            // We have historical data
            dataSource = "historical";
            monthlyHours = usage.hours_spent || 0;
            hoursAllotted = usage.hours_allotted || 0;
          } else {
            // No historical data found
            dataSource = "no data";
            monthlyHours = 0;
          }
        }
        
        // Get the SQL query that was executed (for debugging)
        const usageQuery = supabase
          .from('subscription_usage')
          .select('*')
          .eq('project_id', selectedProjectId)
          .eq('month_year', selectedMonth);
          
        console.log('Usage query:', JSON.stringify(usageQuery.toJSON?.() || usageQuery));
      }
      
      // 3. Create the final data object
      const finalData = {
        projectName: projectData.name,
        status: projectData.project_subscriptions?.[0]?.subscription_status || "unknown",
        renewalDate: projectData.project_subscriptions?.[0]?.next_renewal_date,
        hoursSpent: monthlyHours,
        hoursAllotted: hoursAllotted,
        dataSource: dataSource,
        isCurrentMonth: isCurrentMonth,
      };
      
      // Save all the raw data for debugging
      setRawData({
        tasks: tasksData,
        usageData: usageData,
        subscriptionData: projectData.project_subscriptions,
        selectedDate: selectedDate,
        isCurrentMonth: isCurrentMonth,
        dataSource: dataSource
      });
      
      setSubscriptionData(finalData);
      setLoading(false);
    };
    
    fetchSubscriptionData();
  }, [selectedProjectId, selectedMonth]);

  // Generate month options for the select (current + past 5 months)
  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      options.push({ value, label });
    }
    
    return options;
  };
  
  const monthOptions = getMonthOptions();

  // Get color for status badge
  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Subscription Data Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Settings</CardTitle>
            <CardDescription>Select a project and month to test</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project</label>
              <Select
                value={selectedProjectId || ''}
                onValueChange={(value) => setSelectedProjectId(value)}
                disabled={loading || projects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Month</label>
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
                disabled={loading || !selectedProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {loading ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse h-20 bg-gray-100 rounded"></div>
            </CardContent>
          </Card>
        ) : subscriptionData ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>{subscriptionData.projectName}</CardTitle>
                <CardDescription>{selectedMonth}</CardDescription>
              </div>
              <Badge className={getStatusColor(subscriptionData.status)}>
                {subscriptionData.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Hours Used</span>
                    <span className="text-sm font-medium">{subscriptionData.hoursSpent} / {subscriptionData.hoursAllotted}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ 
                        width: `${Math.min(
                          (subscriptionData.hoursSpent / Math.max(subscriptionData.hoursAllotted, 1)) * 100, 
                          100
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <div>
                    <span className="text-sm font-medium">Data Source</span>
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="text-xs">
                        {subscriptionData.dataSource}
                      </Badge>
                    </div>
                  </div>
                  
                  {subscriptionData.renewalDate && (
                    <div>
                      <span className="text-sm font-medium">Next Renewal</span>
                      <div className="text-sm mt-1">
                        {new Date(subscriptionData.renewalDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
      
      {subscriptionData && (
        <Tabs defaultValue="summary">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="debug">Debug Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Hour Calculation Method</CardTitle>
                <CardDescription>How the hours data is being calculated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {rawData.isCurrentMonth ? (
                        <span>Current month: Hours calculated from tasks</span>
                      ) : rawData.usageData ? (
                        <span>Past month: Hours retrieved from subscription_usage history</span>
                      ) : (
                        <span>Past month: No historical data found in subscription_usage</span>
                      )}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Details</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Selected Month: {format(rawData.selectedDate, 'MMMM yyyy')}</li>
                      <li>Hours Allotted: {subscriptionData.hoursAllotted}</li>
                      <li>Hours Spent: {subscriptionData.hoursSpent}</li>
                      <li>Data Source: {subscriptionData.dataSource}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="debug">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Raw Data</CardTitle>
                  <CardDescription>Raw data for debugging</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Project Subscription Data</h3>
                      <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs">
                        {JSON.stringify(rawData.subscriptionData, null, 2)}
                      </pre>
                    </div>
                    
                    <Separator />
                    
                    {rawData.isCurrentMonth ? (
                      <div>
                        <h3 className="font-medium mb-2">Current Month Tasks Data</h3>
                        {rawData.tasks && rawData.tasks.length > 0 ? (
                          <div>
                            <p className="text-sm mb-2">Tasks Count: {rawData.tasks.length}</p>
                            <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs">
                              {JSON.stringify(rawData.tasks, null, 2)}
                            </pre>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No tasks found for this month</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-medium mb-2">Historical Usage Data</h3>
                        {rawData.usageData ? (
                          <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs">
                            {JSON.stringify(rawData.usageData, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-sm text-muted-foreground">No historical data found for this month</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default TestSubscription;
