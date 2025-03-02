
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, parse } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const TestSubscription = () => {
  // State for selected project and month
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);
  
  // Generate options for the last 6 months (including current)
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMM yyyy'),
    };
  });

  // Load projects for dropdown
  useEffect(() => {
    const loadProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error loading projects:', error);
        return;
      }
      
      if (data) {
        const options = data.map(project => ({
          value: project.id,
          label: project.name
        }));
        setProjectOptions(options);
        
        // Auto-select first project if none selected
        if (options.length > 0 && !selectedProject) {
          setSelectedProject(options[0].value);
        }
      }
    };
    
    loadProjects();
  }, [selectedProject]);

  // Calculate date ranges based on selected month
  const selectedDate = parse(selectedMonth, 'yyyy-MM', new Date());
  const startDate = startOfMonth(selectedDate);
  const endDate = endOfMonth(selectedDate);
  const isCurrentMonth = selectedMonth === format(new Date(), 'yyyy-MM');

  // Fetch subscription data
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription', selectedProject, selectedMonth],
    queryFn: async () => {
      if (!selectedProject) return null;
      
      // Fetch project subscription data
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
        .eq('id', selectedProject)
        .single();
        
      if (projectError) {
        console.error('Error fetching project subscription data:', projectError);
        throw projectError;
      }
      
      // Determine data source and fetch hours
      let hoursSpent = 0;
      let hoursAllotted = projectData?.project_subscriptions?.[0]?.hours_allotted || 0;
      let dataSource = "unknown";
      let rawTasksData = null;
      let rawUsageData = null;
      let tasksQuery = "";
      let usageQuery = "";
      
      if (isCurrentMonth) {
        // Current month - calculate from tasks
        dataSource = "live";
        
        // Create query reference for debugging
        const taskQueryRef = supabase
          .from('tasks')
          .select('id, actual_hours_spent, created_at')
          .eq('project_id', selectedProject)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
          
        // Get the query SQL for display
        tasksQuery = `
          SELECT id, actual_hours_spent, created_at 
          FROM tasks 
          WHERE project_id = '${selectedProject}'
          AND created_at >= '${startDate.toISOString()}'
          AND created_at <= '${endDate.toISOString()}'
        `;
        
        // Execute the query
        const { data: tasksData, error: tasksError } = await taskQueryRef;
        
        if (tasksError) {
          console.error('Error fetching tasks data:', tasksError);
        } else {
          // Calculate total hours spent from tasks
          hoursSpent = tasksData ? 
            tasksData.reduce((sum, task) => sum + (task.actual_hours_spent || 0), 0) : 
            0;
            
          // Store raw data for debug display
          rawTasksData = tasksData;
        }
      } 
      else {
        // Past month - check subscription_usage
        dataSource = "historical";
        
        // Create query reference for debugging
        const usageQueryRef = supabase
          .from('subscription_usage')
          .select('*')
          .eq('project_id', selectedProject)
          .eq('month_year', selectedMonth);
          
        // Get the query SQL for display
        usageQuery = `
          SELECT * 
          FROM subscription_usage 
          WHERE project_id = '${selectedProject}'
          AND month_year = '${selectedMonth}'
        `;
        
        // Execute the query
        const { data: usageData, error: usageError } = await usageQueryRef;
        
        if (usageError) {
          console.error('Error fetching usage data:', usageError);
        }
        
        if (usageData && usageData.length > 0) {
          hoursSpent = usageData[0].hours_spent || 0;
          hoursAllotted = usageData[0].hours_allotted || 0;
          rawUsageData = usageData[0];
        } else {
          dataSource = "no data";
          hoursSpent = 0;
        }
      }
      
      return {
        projectName: projectData?.name,
        subscription: projectData?.project_subscriptions?.[0],
        hours: {
          spent: hoursSpent,
          allotted: hoursAllotted
        },
        dataSource,
        debug: {
          rawTasksData,
          rawUsageData,
          tasksQuery,
          usageQuery
        }
      };
    },
    enabled: !!selectedProject,
  });

  // Calculate usage percentage
  const usagePercentage = subscriptionData?.hours?.allotted 
    ? Math.min(Math.round((subscriptionData.hours.spent / subscriptionData.hours.allotted) * 100), 100)
    : 0;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Subscription Testing Page</h1>
      
      {/* Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-2">Project Selection</h2>
          <Select 
            value={selectedProject || ''} 
            onValueChange={setSelectedProject}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projectOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-2">Month Selection</h2>
          <Select 
            value={selectedMonth} 
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      </div>
      
      {/* Data Display */}
      {isLoadingSubscription ? (
        <div className="text-center py-8">Loading subscription data...</div>
      ) : subscriptionData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subscription Status Panel */}
          <Card className="p-4">
            <h2 className="text-lg font-medium mb-4">Project: {subscriptionData.projectName}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-500">Subscription Status</h3>
                <p className="font-medium">{subscriptionData.subscription?.subscription_status || 'No subscription'}</p>
              </div>
              
              <div>
                <h3 className="text-sm text-gray-500">Next Renewal Date</h3>
                <p className="font-medium">
                  {subscriptionData.subscription?.next_renewal_date 
                    ? new Date(subscriptionData.subscription.next_renewal_date).toLocaleDateString() 
                    : 'Not set'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm text-gray-500">Data Source</h3>
                <div className="flex items-center">
                  <span className="font-medium mr-2">{subscriptionData.dataSource}</span>
                  {subscriptionData.dataSource !== "live" && subscriptionData.dataSource !== "historical" && (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </div>
            </div>
          </Card>
          
          {/* Hours Panel */}
          <Card className="p-4">
            <h2 className="text-lg font-medium mb-4">Hours Usage: {selectedMonth}</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <h3 className="text-sm text-gray-500">Hours Used / Allotted</h3>
                  <span className="font-medium">{subscriptionData.hours.spent.toFixed(1)} / {subscriptionData.hours.allotted}</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>
              
              <div>
                <h3 className="text-sm text-gray-500">Current Month</h3>
                <p className="font-medium">{isCurrentMonth ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </Card>
          
          {/* Debug Panel */}
          <Card className="p-4 col-span-full">
            <h2 className="text-lg font-medium mb-4">Debug Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tasks Query {isCurrentMonth ? '(Active)' : ''}</h3>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {subscriptionData.debug.tasksQuery || 'No query'}
                </pre>
                
                <h3 className="text-sm font-medium text-gray-700 mt-4 mb-2">Raw Tasks Data</h3>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {subscriptionData.debug.rawTasksData 
                    ? JSON.stringify(subscriptionData.debug.rawTasksData, null, 2) 
                    : 'No data'}
                </pre>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Usage Query {!isCurrentMonth ? '(Active)' : ''}</h3>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {subscriptionData.debug.usageQuery || 'No query'}
                </pre>
                
                <h3 className="text-sm font-medium text-gray-700 mt-4 mb-2">Raw Usage Data</h3>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {subscriptionData.debug.rawUsageData 
                    ? JSON.stringify(subscriptionData.debug.rawUsageData, null, 2) 
                    : 'No data'}
                </pre>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8">Select a project to view data</div>
      )}
    </div>
  );
};

export default TestSubscription;
