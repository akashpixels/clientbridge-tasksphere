
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TimelineVisualization } from "./TimelineVisualization";
import { HelpCircle } from "lucide-react";
import { formatDuration } from "@/lib/date-utils";

// Form schema with validations
const taskFormSchema = z.object({
  details: z.string()
    .min(10, { message: "Task details must be at least 10 characters" })
    .max(1000, { message: "Task details must be less than 1000 characters" }),
  task_type_id: z.coerce.number(),
  priority_level_id: z.coerce.number(),
  complexity_level_id: z.coerce.number().default(3),
  target_device: z.enum(["Desktop", "Mobile", "Both"]).default("Both"),
  assigned_user_id: z.string().optional(),
  reference_links: z.array(z.string().url({ message: "Must be a valid URL" })).optional(),
  images: z.array(z.any()).optional(),
  dependent_task_id: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  onSubmit: (data: TaskFormValues) => void;
  isSubmitting: boolean;
}

export const TaskForm = ({ onSubmit, isSubmitting }: TaskFormProps) => {
  const { id: projectId } = useParams<{ id: string }>();
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [priorityLevels, setPriorityLevels] = useState<any[]>([]);
  const [complexityLevels, setComplexityLevels] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  const [timelineParams, setTimelineParams] = useState<any>({
    taskTypeId: null,
    priorityLevelId: null,
    complexityLevelId: 3,
  });
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      details: "",
      complexity_level_id: 3,
      target_device: "Both",
    },
  });

  // Fetch project details including task_type_options
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          task_type_options
        `)
        .eq('id', projectId)
        .single();
      
      if (error) {
        console.error("Error fetching project:", error);
        return;
      }
      
      setProject(data);
    };
    
    fetchProject();
  }, [projectId]);

  // Fetch task types with filtering based on project options
  useEffect(() => {
    const fetchTaskTypes = async () => {
      const { data, error } = await supabase
        .from('task_types')
        .select('*')
        .order('category')
        .order('name');
      
      if (error) {
        console.error("Error fetching task types:", error);
        return;
      }
      
      if (project?.task_type_options && project.task_type_options.length > 0) {
        const filteredTaskTypes = data.filter(type => 
          project.task_type_options.includes(type.id)
        );
        setTaskTypes(filteredTaskTypes);
      } else {
        setTaskTypes(data);
      }
    };
    
    if (project) {
      fetchTaskTypes();
    }
  }, [project]);

  // Fetch priority levels
  useEffect(() => {
    const fetchPriorityLevels = async () => {
      const { data, error } = await supabase
        .from('priority_levels')
        .select('*')
        .order('id');
      
      if (error) {
        console.error("Error fetching priority levels:", error);
        return;
      }
      
      setPriorityLevels(data);
    };
    
    fetchPriorityLevels();
  }, []);

  // Fetch complexity levels
  useEffect(() => {
    const fetchComplexityLevels = async () => {
      const { data, error } = await supabase
        .from('complexity_levels')
        .select('*')
        .eq('is_active', true)
        .order('id');
      
      if (error) {
        console.error("Error fetching complexity levels:", error);
        return;
      }
      
      setComplexityLevels(data);
    };
    
    fetchComplexityLevels();
  }, []);

  // Fetch users assigned to the project
  useEffect(() => {
    const fetchProjectUsers = async () => {
      if (!projectId) return;
      
      const { data, error } = await supabase
        .from('project_assignees')
        .select(`
          user_id,
          user_profiles:user_id(
            id,
            first_name,
            last_name
          )
        `)
        .eq('project_id', projectId);
      
      if (error) {
        console.error("Error fetching project users:", error);
        return;
      }
      
      setProjectUsers(data.map(item => item.user_profiles));
    };
    
    fetchProjectUsers();
  }, [projectId]);

  // Update timeline parameters when form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      setTimelineParams({
        taskTypeId: value.task_type_id,
        priorityLevelId: value.priority_level_id,
        complexityLevelId: value.complexity_level_id || 3,
      });
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const handleFormSubmit = (values: TaskFormValues) => {
    onSubmit(values);
  };

  // Helper function to get tooltip content for complexity
  const getComplexityTooltip = (level: any) => {
    if (!level) return "";
    const multiplier = level.multiplier;
    
    if (multiplier < 1) {
      return `${Math.round((1 - multiplier) * 100)}% faster completion`;
    } else if (multiplier === 1) {
      return "Standard completion time";
    } else {
      return `${Math.round((multiplier - 1) * 100)}% longer completion`;
    }
  };

  // Helper function to get tooltip content for priority
  const getPriorityTooltip = (level: any) => {
    if (!level) return "";
    const timeToStart = level.time_to_start ? formatDuration(level.time_to_start) : "immediate";
    const multiplier = level.multiplier ? `${level.multiplier}x duration` : "standard duration";
    
    return `${timeToStart} delay, ${multiplier}`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Task Details */}
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what needs to be done..." 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Task Type */}
            <FormField
              control={form.control}
              name="task_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Task Type
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle size={16} className="text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Affects time estimate and scheduling</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value?.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskTypes.length > 0 && taskTypes.reduce((acc: any[], type: any) => {
                          const categoryExists = acc.some(item => item.category === type.category);
                          
                          if (!categoryExists) {
                            acc.push({
                              category: type.category,
                              items: taskTypes.filter(t => t.category === type.category)
                            });
                          }
                          
                          return acc;
                        }, []).map((categoryGroup: any) => (
                          <div key={categoryGroup.category} className="mb-2">
                            <div className="px-2 py-1.5 text-sm font-semibold bg-muted">{categoryGroup.category}</div>
                            {categoryGroup.items.map((type: any) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority Level */}
            <FormField
              control={form.control}
              name="priority_level_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Priority Level
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle size={16} className="text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Affects queue position and start time</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value?.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityLevels.map(level => (
                          <TooltipProvider key={level.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <SelectItem value={level.id.toString()}>
                                  <div className="flex items-center">
                                    <span 
                                      className="w-3 h-3 rounded-full mr-2"
                                      style={{ backgroundColor: level.color || '#888888' }}
                                    />
                                    {level.name}
                                  </div>
                                </SelectItem>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{getPriorityTooltip(level)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Complexity Level */}
            <FormField
              control={form.control}
              name="complexity_level_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Complexity Level
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle size={16} className="text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Affects effort and completion time</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value?.toString() || "3"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                      <SelectContent>
                        {complexityLevels.map(level => (
                          <TooltipProvider key={level.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <SelectItem value={level.id.toString()}>
                                  {level.name}
                                </SelectItem>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{getComplexityTooltip(level)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Device */}
            <FormField
              control={form.control}
              name="target_device"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Device</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target device" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Desktop">Desktop</SelectItem>
                        <SelectItem value="Mobile">Mobile</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assigned User */}
            <FormField
              control={form.control}
              name="assigned_user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned User (Optional)</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Reference Links - Placeholder, would need additional implementation for array field */}
            <div className="space-y-2">
              <FormLabel className="block">Reference Links (Optional)</FormLabel>
              <Input type="url" placeholder="Add reference links (click + to add more)" />
            </div>

          </div>
          
          {/* Timeline Visualization Column */}
          <div className="bg-muted/40 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Timeline Visualization</h3>
            <TimelineVisualization 
              taskTypeId={timelineParams.taskTypeId} 
              priorityLevelId={timelineParams.priorityLevelId}
              complexityLevelId={timelineParams.complexityLevelId}
              projectId={projectId}
            />
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </form>
    </Form>
  );
};
