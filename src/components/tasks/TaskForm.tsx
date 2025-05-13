import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useTaskSchedule } from '@/hooks/useTaskSchedule';
import TaskScheduleInfo from './TaskScheduleInfo';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  details: z.string().min(2, {
    message: 'Details must be at least 2 characters.',
  }),
  taskTypeId: z.string().min(1, {
    message: 'Please select a task type.',
  }),
  priorityLevelId: z.string().min(1, {
    message: 'Please select a priority level.',
  }),
  complexityLevelId: z.string().min(1, {
    message: 'Please select a complexity level.',
  }),
  targetDevice: z.enum(['desktop', 'mobile', 'both']).optional(),
  estStart: z.date().optional(),
  estEnd: z.date().optional(),
  referenceLinks: z.record(z.string(), z.string()).optional(),
  images: z.array(z.string()).optional(),
});

interface TaskFormProps {
  projectId: string;
  onClose: () => void;
}

type FormValues = z.infer<typeof formSchema>;

const TaskForm = ({ projectId, onClose }: TaskFormProps) => {
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [priorityLevels, setPriorityLevels] = useState<any[]>([]);
  const [complexityLevels, setComplexityLevels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    getTaskSchedule,
    formatScheduleDate,
    formatDuration,
    loading: scheduleLoading,
    error: scheduleError,
    scheduleData
  } = useTaskSchedule();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [taskTypesResponse, priorityLevelsResponse, complexityLevelsResponse] = await Promise.all([
          supabase.from('task_types').select('*'),
          supabase.from('priority_levels').select('*'),
          supabase.from('complexity_levels').select('*'),
        ]);

        if (taskTypesResponse.error || priorityLevelsResponse.error || complexityLevelsResponse.error) {
          console.error('Error fetching data:', taskTypesResponse.error, priorityLevelsResponse.error, complexityLevelsResponse.error);
          return;
        }

        setTaskTypes(taskTypesResponse.data || []);
        setPriorityLevels(priorityLevelsResponse.data || []);
        setComplexityLevels(complexityLevelsResponse.data || []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add new useEffect to fetch task schedule when form values change
  useEffect(() => {
    const calculateSchedule = async () => {
      const priorityId = form.getValues('priorityLevelId');
      const taskTypeId = form.getValues('taskTypeId');
      const complexityId = form.getValues('complexityLevelId');
      
      // Only calculate if we have all required values
      if (projectId && priorityId && taskTypeId && complexityId) {
        await getTaskSchedule({
          projectId,
          priorityLevelId: parseInt(priorityId, 10),
          taskTypeId: parseInt(taskTypeId, 10),
          complexityLevelId: parseInt(complexityId, 10)
        });
      }
    };

    // Add a small delay to prevent too many calculations when user is actively selecting options
    const timer = setTimeout(calculateSchedule, 500);
    return () => clearTimeout(timer);
  }, [
    form.watch('priorityLevelId'),
    form.watch('taskTypeId'),
    form.watch('complexityLevelId'),
    projectId,
    getTaskSchedule,
    form
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      details: '',
      taskTypeId: '',
      priorityLevelId: '',
      complexityLevelId: '',
      targetDevice: undefined,
      estStart: undefined,
      estEnd: undefined,
      referenceLinks: {},
      images: [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    const formData = {
      project_id: projectId,
      details: data.details,
      task_type_id: parseInt(data.taskTypeId, 10),
      priority_level_id: parseInt(data.priorityLevelId, 10),
      complexity_level_id: parseInt(data.complexityLevelId, 10),
      target_device: data.targetDevice,
      reference_links: data.referenceLinks,
      images: data.images,
    };
    
    // Add the est_start, est_end, and current_status_id from scheduleData if available
    if (scheduleData) {
      formData.est_start = scheduleData.est_start;
      formData.est_end = scheduleData.est_end;
      formData.current_status_id = scheduleData.initial_status_id;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([formData]);

      if (error) {
        console.error('Error creating task:', error);
        toast({
          title: "Error creating task",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Task created",
        description: "The task has been created successfully.",
      });
      onClose();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected error",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        control={form.control}
        name="details"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Details</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter task details"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Detailed description of the task.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="taskTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {taskTypes.map((taskType) => (
                    <SelectItem key={taskType.id} value={String(taskType.id)}>
                      {taskType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The type of task.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="priorityLevelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a priority level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {priorityLevels.map((priorityLevel) => (
                    <SelectItem key={priorityLevel.id} value={String(priorityLevel.id)}>
                      {priorityLevel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The priority level of the task.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="complexityLevelId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Complexity Level</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a complexity level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {complexityLevels.map((complexityLevel) => (
                  <SelectItem key={complexityLevel.id} value={String(complexityLevel.id)}>
                    {complexityLevel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              The complexity level of the task.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="targetDevice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target Device</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select target device" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              The device for which the task is targeted.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="estStart"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Estimated Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                The estimated start date of the task.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="estEnd"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Estimated End Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                The estimated end date of the task.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Add the TaskScheduleInfo component after the form fields */}
      <TaskScheduleInfo
        estStart={scheduleData ? formatScheduleDate(scheduleData.est_start) : undefined}
        estEnd={scheduleData ? formatScheduleDate(scheduleData.est_end) : undefined}
        duration={scheduleData ? formatDuration(scheduleData.calculated_est_duration) : undefined}
        loading={scheduleLoading}
        error={scheduleError}
      />
      
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="ml-2">
          Create Task
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
