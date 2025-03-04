
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TimelineVisualization } from "./TimelineVisualization";
import { useParams } from "react-router-dom";

// Define the schema for task creation
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  task_type_id: z.coerce.number(),
  priority_level_id: z.coerce.number(),
  complexity_level_id: z.coerce.number(),
  current_status_id: z.coerce.number().default(1), // Default to "Open"
  estimated_hours: z.coerce.number().optional(),
});

export const CustomTaskForm = ({ onSubmit, isSubmitting }: { onSubmit: (data: any) => void; isSubmitting: boolean }) => {
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [priorityLevels, setPriorityLevels] = useState<any[]>([]);
  const [complexityLevels, setComplexityLevels] = useState<any[]>([]);
  const [queuePosition, setQueuePosition] = useState(0);
  const { id: projectId } = useParams<{ id: string }>();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      task_type_id: 1,
      priority_level_id: 3,
      complexity_level_id: 2,
      current_status_id: 1,
    },
  });
  
  // Get selected values for visualization
  const selectedTaskTypeId = form.watch("task_type_id");
  const selectedPriorityLevelId = form.watch("priority_level_id");
  const selectedComplexityLevelId = form.watch("complexity_level_id");
  
  // Fetch queue position
  useEffect(() => {
    const fetchQueuePosition = async () => {
      if (!projectId) return;
      
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .in('current_status_id', [1, 2, 3]); // Open, Pending, In Progress
      
      if (error) {
        console.error("Error fetching queue position:", error);
        return;
      }
      
      setQueuePosition(count || 0);
    };
    
    fetchQueuePosition();
    
    // Refresh queue position every minute
    const interval = setInterval(fetchQueuePosition, 60000);
    return () => clearInterval(interval);
  }, [projectId]);

  // Fetch task types, priority levels, and complexity levels
  useEffect(() => {
    const fetchTaskTypes = async () => {
      const { data, error } = await supabase.from("task_types").select("*");
      if (error) {
        console.error("Error fetching task types:", error);
        return;
      }
      setTaskTypes(data || []);
    };

    const fetchPriorityLevels = async () => {
      const { data, error } = await supabase.from("priority_levels").select("*");
      if (error) {
        console.error("Error fetching priority levels:", error);
        return;
      }
      setPriorityLevels(data || []);
    };

    const fetchComplexityLevels = async () => {
      const { data, error } = await supabase.from("complexity_levels").select("*");
      if (error) {
        console.error("Error fetching complexity levels:", error);
        return;
      }
      setComplexityLevels(data || []);
    };

    fetchTaskTypes();
    fetchPriorityLevels();
    fetchComplexityLevels();
  }, []);

  function handleFormSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values);
  }

  return (
    <div className="space-y-6">
      <TimelineVisualization
        taskTypeId={selectedTaskTypeId}
        priorityLevelId={selectedPriorityLevelId}
        complexityLevelId={selectedComplexityLevelId}
        projectId={projectId}
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter task title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the task..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="task_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {taskTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority_level_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorityLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="complexity_level_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complexity</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {complexityLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              Create Task {queuePosition > 0 && <span className="ml-1 text-xs">({queuePosition + 1} in queue)</span>}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
