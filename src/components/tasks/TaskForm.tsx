
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon, Paperclip, Laptop, Smartphone, Monitor } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import AttachmentHandler from '@/components/project-layouts/maintenance/comments/AttachmentHandler';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [referenceLinks, setReferenceLinks] = useState<{[key: string]: string}>({});
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  
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

  const addReferenceLink = () => {
    if (linkName && linkUrl) {
      setReferenceLinks(prev => ({
        ...prev,
        [linkName]: linkUrl
      }));
      setLinkName('');
      setLinkUrl('');
      form.setValue('referenceLinks', {
        ...form.getValues('referenceLinks'),
        [linkName]: linkUrl
      });
    }
  };

  const removeReferenceLink = (key: string) => {
    const newLinks = {...referenceLinks};
    delete newLinks[key];
    setReferenceLinks(newLinks);
    form.setValue('referenceLinks', newLinks);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const uploadedImages: string[] = [];
      
      // Upload files if there are any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const filePath = `tasks/${projectId}/${Date.now()}_${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('project-files')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            toast({
              title: "Upload failed",
              description: uploadError.message,
              variant: "destructive"
            });
            return;
          }

          // Get public URL for the file
          const { data: urlData } = supabase.storage
            .from('project-files')
            .getPublicUrl(filePath);
          
          uploadedImages.push(urlData.publicUrl);
        }
      }
      
      const formData: any = {
        project_id: projectId,
        details: data.details,
        task_type_id: parseInt(data.taskTypeId, 10),
        priority_level_id: parseInt(data.priorityLevelId, 10),
        complexity_level_id: parseInt(data.complexityLevelId, 10),
        target_device: data.targetDevice,
        reference_links: referenceLinks,
        images: uploadedImages,
      };
      
      // Add the est_start, est_end, and current_status_id from scheduleData if available
      if (scheduleData) {
        formData.est_start = scheduleData.est_start;
        formData.est_end = scheduleData.est_end;
        formData.current_status_id = scheduleData.initial_status_id;
      }

      const { error } = await supabase
        .from('tasks')
        .insert(formData);

      if (error) {
        console.error('Error creating task:', error);
        toast({
          title: "Error creating task",
          description: "Please try again."
        });
        return;
      }

      toast({
        title: "Task created",
        description: "The task has been created successfully."
      });
      
      // If schedule data was used, show a schedule notification
      if (scheduleData) {
        toast({
          title: "Schedule Calculated",
          description: `Task scheduled to start at ${formatScheduleDate(scheduleData.est_start)}`
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected error",
        description: "Please try again."
      });
    }
  };

  return (
    <Form {...form}>
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
        
        <div className="space-y-4">
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
                <div className="flex gap-2 mt-1">
                  <Button
                    type="button"
                    variant={field.value === 'desktop' ? 'default' : 'outline'}
                    className="flex-1 flex items-center gap-2"
                    onClick={() => form.setValue('targetDevice', 'desktop')}
                  >
                    <Laptop className="h-4 w-4" />
                    Desktop
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'mobile' ? 'default' : 'outline'}
                    className="flex-1 flex items-center gap-2"
                    onClick={() => form.setValue('targetDevice', 'mobile')}
                  >
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'both' ? 'default' : 'outline'}
                    className="flex-1 flex items-center gap-2"
                    onClick={() => form.setValue('targetDevice', 'both')}
                  >
                    <Monitor className="h-4 w-4" />
                    Both
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Reference Links</h3>
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                placeholder="Link name"
                className="flex-1"
              />
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="URL"
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline"
                onClick={addReferenceLink}
                disabled={!linkName || !linkUrl}
              >
                Add
              </Button>
            </div>
            
            {Object.keys(referenceLinks).length > 0 && (
              <div className="border rounded-md p-2 space-y-2 mt-2 bg-slate-50">
                {Object.entries(referenceLinks).map(([key, url]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{key}:</span>{" "}
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        {url}
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReferenceLink(key)}
                      className="h-6 w-6 p-0"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2">Attachments</h3>
            <div className="border rounded-md p-3">
              <AttachmentHandler 
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
              />
              
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                        }}
                        className="h-6 w-6 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
          <Button type="button" variant="secondary" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button type="submit">
            Create Task
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TaskForm;
