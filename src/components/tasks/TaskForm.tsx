
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PrioritySelector } from "./PrioritySelector";
import { Loader2 } from "lucide-react";

interface TaskFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  activeTaskCount: number;
  onFormChange?: (data: any) => void;
}

const formSchema = z.object({
  details: z.string().min(5, "Task description must be at least 5 characters"),
  task_type_id: z.string(),
  priority_level_id: z.coerce.number(),
  current_status_id: z.coerce.number().default(1),
  complexity_level_id: z.coerce.number().default(3),
  target_device: z.enum(["desktop", "mobile", "both"]).default("both"),
});

export const TaskForm = ({ onSubmit, isSubmitting, activeTaskCount, onFormChange }: TaskFormProps) => {
  const { id: projectId } = useParams<{ id: string }>();
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [complexityLevels, setComplexityLevels] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      details: "",
      task_type_id: "",
      priority_level_id: 3, // Default to Normal priority
      current_status_id: 1, // Default to Unassigned status
      complexity_level_id: 3, // Default to Standard complexity
      target_device: "both",
    },
  });
  
  // Watch for form changes to trigger ETA calculation
  useEffect(() => {
    const subscription = form.watch((formValues) => {
      if (onFormChange && formValues.task_type_id && formValues.complexity_level_id && formValues.priority_level_id) {
        onFormChange(formValues);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, onFormChange]);

  useEffect(() => {
    // Fetch task types
    const fetchTaskTypes = async () => {
      try {
        const { data, error } = await supabase
          .from("task_types")
          .select("id, name, category")
          .order("name");

        if (error) {
          console.error("Error fetching task types:", error);
        } else {
          setTaskTypes(data || []);
          // Set default task type if available
          if (data && data.length > 0) {
            form.setValue("task_type_id", data[0].id.toString());
            
            // If onFormChange exists, trigger it with the initial form data
            if (onFormChange) {
              setTimeout(() => {
                onFormChange(form.getValues());
              }, 100);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch task types:", error);
      }
    };

    // Fetch complexity levels
    const fetchComplexityLevels = async () => {
      try {
        const { data, error } = await supabase
          .from("complexity_levels")
          .select("id, name, multiplier")
          .order("id");

        if (error) {
          console.error("Error fetching complexity levels:", error);
        } else {
          setComplexityLevels(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch complexity levels:", error);
      }
    };

    fetchTaskTypes();
    fetchComplexityLevels();
  }, [projectId]);

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!projectId) return;
    
    // Convert task_type_id from string to number for database compatibility
    const taskData = {
      ...data,
      task_type_id: parseInt(data.task_type_id),
      project_id: projectId
    };
    
    onSubmit(taskData);
  };

  return (
    <ScrollArea className="h-full pb-8">
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the task in detail" 
                      {...field} 
                      rows={4}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="task_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Type</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Trigger onFormChange if it exists
                        if (onFormChange) {
                          const currentValues = form.getValues();
                          onFormChange({
                            ...currentValues,
                            task_type_id: value
                          });
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
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
                name="complexity_level_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complexity</FormLabel>
                    <Select 
                      value={field.value.toString()} 
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                        // Trigger onFormChange if it exists
                        if (onFormChange) {
                          const currentValues = form.getValues();
                          onFormChange({
                            ...currentValues,
                            complexity_level_id: parseInt(value)
                          });
                        }
                      }}
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
            
            <FormField
              control={form.control}
              name="priority_level_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <PrioritySelector 
                      value={field.value} 
                      onChange={(value) => {
                        field.onChange(value);
                        // Trigger onFormChange if it exists
                        if (onFormChange) {
                          const currentValues = form.getValues();
                          onFormChange({
                            ...currentValues,
                            priority_level_id: value
                          });
                        }
                      }} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="target_device"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Device</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select device" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {activeTaskCount > 0 && (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                <p className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  There {activeTaskCount === 1 ? 'is' : 'are'} currently {activeTaskCount} active task{activeTaskCount === 1 ? '' : 's'}.
                  This task may be queued.
                </p>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
};
