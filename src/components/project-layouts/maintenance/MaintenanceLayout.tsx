
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import CredentialsTab from "../shared/CredentialsTab";
import FilesTab from "../shared/FilesTab";
import TasksTabContent from "./TasksTabContent";
import TeamTab from "../shared/TeamTab";
import ProjectHeader from "./ProjectHeader";
import ImageViewerDialog from "./ImageViewerDialog";
import TaskCommentThread from "./comments/TaskCommentThread";

interface MaintenanceLayoutProps {
  project: Tables<"projects"> & {
    client_admin: {
      id: string;
      business_name: string;
      user_profiles: {
        first_name: string;
        last_name: string;
      } | null;
    } | null;
    status: {
      name: string;
      color_hex: string | null;
    } | null;
    project_subscriptions: {
      subscription_status: string;
      hours_allotted: number;
      hours_spent?: number | null;
      next_renewal_date: string;
      billing_cycle?: string;
    }[];
  };
}

// Define a type that matches the TasksTable expected input structure
type TaskWithRelations = Tables<"tasks"> & {
  task_type: {
    name: string;
    category: string;
  } | null;
  status: {
    name: string;
    color_hex: string | null;
  } | null;
  priority: {
    name: string;
    color: string;
  } | null;
  complexity: {
    name: string;
    multiplier: number;
  } | null;
  assigned_user: {
    first_name: string;
    last_name: string;
  } | null;
};

const MaintenanceLayout = ({ project }: MaintenanceLayoutProps) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string>("");
  const [imageArray, setImageArray] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: 'created_at',
    direction: 'desc',
  });

  // Current month selection for filtering tasks/hours
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );

  // Debug log project data
  useEffect(() => {
    console.log("MaintenanceLayout project data:", project);
    console.log("Project ID:", project.id);
  }, [project]);

  // Get tasks for the project - fix the query to avoid multiple relationship issue
  const { data: tasksData = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['project-tasks', project.id, selectedMonth, sortConfig],
    queryFn: async () => {
      const startDate = startOfMonth(parseISO(selectedMonth));
      const endDate = endOfMonth(parseISO(selectedMonth));
      
      console.log('Fetching tasks for project:', project.id);
      console.log('Date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
      
      try {
        // First approach: Using specific relationship hints
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            task_type:task_types(name, category),
            status:task_statuses!tasks_current_status_id_fkey(name, color_hex),
            priority:priority_levels(name, color),
            complexity:complexity_levels(name, multiplier),
            assigned_user:user_profiles(first_name, last_name)
          `)
          .eq('project_id', project.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order(sortConfig.key, { ascending: sortConfig.direction === 'asc' });

        if (error) {
          console.error('Error fetching tasks with relationship hint:', error);
          throw error;
        }
        
        console.log(`Found ${data.length} tasks for ${selectedMonth}:`, data);
        return data;
      } catch (firstError) {
        console.error('First approach failed:', firstError);
        
        // Fallback approach: Fetch tasks first, then fetch related data separately
        try {
          const { data: tasksOnly, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', project.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order(sortConfig.key, { ascending: sortConfig.direction === 'asc' });
            
          if (tasksError) {
            console.error('Error fetching tasks:', tasksError);
            throw tasksError;
          }
          
          // Create placeholder objects that match the expected structure
          return tasksOnly.map(task => ({
            ...task,
            task_type: null,
            status: null,
            priority: null, 
            complexity: null,
            assigned_user: null
          }));
        } catch (fallbackError) {
          console.error('Fallback approach failed:', fallbackError);
          return [];
        }
      }
    },
  });

  // Map tasks to ensure they match the expected type
  const tasks: TaskWithRelations[] = Array.isArray(tasksData) ? tasksData.map(task => {
    return {
      ...task,
      task_type: task.task_type || null,
      status: task.status || null,
      priority: task.priority || null,
      complexity: task.complexity || null,
      assigned_user: task.assigned_user || null,
    };
  }) : [];

  // Calculate hours spent for the selected month
  const { data: monthlyHours = 0 } = useQuery({
    queryKey: ['monthly-hours', project.id, selectedMonth],
    queryFn: async () => {
      const startDate = startOfMonth(parseISO(selectedMonth));
      const endDate = endOfMonth(parseISO(selectedMonth));
      
      console.log('Calculating hours for range:', startDate, 'to', endDate);
      
      const { data, error } = await supabase
        .from('tasks')
        .select('hours_spent, actual_hours_spent')
        .eq('project_id', project.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        console.error('Error fetching task hours:', error);
        return 0;
      }
      
      console.log('Hours calculation data:', data);

      // Sum up either hours_spent or actual_hours_spent (whichever is available)
      const totalHours = data.reduce((acc, task) => {
        const hours = task.actual_hours_spent || task.hours_spent || 0;
        return acc + hours;
      }, 0);
      
      console.log(`Total hours for ${selectedMonth}:`, totalHours);
      return totalHours;
    },
  });

  const handleSort = (key: string) => {
    setSortConfig(prevSortConfig => ({
      key,
      direction: prevSortConfig.key === key && prevSortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc',
    }));
  };

  const handleImageClick = (image: string, images: string[]) => {
    setCurrentImage(image);
    setImageArray(images);
    setIsViewerOpen(true);
  };

  const handleCommentClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsCommentOpen(true);
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <ProjectHeader 
          project={project} 
          selectedMonth={selectedMonth} 
          onMonthChange={handleMonthChange}
          monthlyHours={monthlyHours}
        />
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <TasksTabContent 
            isLoadingTasks={isLoadingTasks}
            tasks={tasks}
            sortConfig={sortConfig}
            onSort={handleSort}
            onImageClick={handleImageClick}
            onCommentClick={handleCommentClick}
          />
        </TabsContent>

        <TabsContent value="files">
          <FilesTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="team">
          <TeamTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="credentials">
          <CredentialsTab projectId={project.id} />
        </TabsContent>
      </Tabs>

      {/* Image Viewer Dialog - use isOpen prop instead of open */}
      <ImageViewerDialog
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        currentImage={currentImage}
        imageArray={imageArray}
      />

      {/* Task Comment Thread Dialog - use isOpen prop instead of open */}
      <TaskCommentThread
        isOpen={isCommentOpen && !!selectedTaskId}
        onClose={() => setIsCommentOpen(false)}
        taskId={selectedTaskId || ""}
      />
    </div>
  );
};

export default MaintenanceLayout;
