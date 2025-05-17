import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useTaskSchedule } from '@/hooks/useTaskSchedule';
import TaskScheduleInfo from './TaskScheduleInfo';
import { PrioritySelector } from './PrioritySelector';
import { formatDuration } from '@/lib/date-utils';
import { useAuth } from '@/context/auth';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { X, Plus, Monitor, Smartphone, MonitorSmartphone, Loader2, Upload } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  targetDevice: z.enum(['desktop', 'mobile', 'both']).default('both'),
  referenceLinks: z.array(z.string().url({
    message: "Must be a valid URL"
  })).default([]),
  imageUrls: z.array(z.string().url({
    message: "Must be a valid URL"
  })).default([]),
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
  const [newReferenceLink, setNewReferenceLink] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [project, setProject] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingSchedule, setIsCalculatingSchedule] = useState(false);
  const { session } = useAuth(); // Add auth session to get user ID
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      details: '',
      taskTypeId: '',
      priorityLevelId: '3', // Default to medium priority
      complexityLevelId: '3', // Default to medium complexity
      targetDevice: 'both',
      referenceLinks: [],
      imageUrls: [],
    },
    mode: "onChange"
  });
  
  const {
    getTaskSchedule,
    formatScheduleDate,
    formatDuration,
    loading: scheduleLoading,
    error: scheduleError,
    scheduleData,
    setScheduleData
  } = useTaskSchedule();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [taskTypesResponse, priorityLevelsResponse, complexityLevelsResponse, projectResponse] = await Promise.all([
          supabase.from('task_types').select('*').order('category').order('name'),
          supabase.from('priority_levels').select('*').order('id'),
          supabase.from('complexity_levels').select('*').eq('is_active', true).order('id'),
          supabase.from('projects').select('id, name, task_type_options').eq('id', projectId).single()
        ]);

        if (taskTypesResponse.error || priorityLevelsResponse.error || complexityLevelsResponse.error || projectResponse.error) {
          console.error('Error fetching data:', taskTypesResponse.error, priorityLevelsResponse.error, complexityLevelsResponse.error, projectResponse.error);
          return;
        }

        setProject(projectResponse.data);
        
        // Fix TypeScript error: check if task_type_options is an array before using length and includes
        const taskTypeOptions = projectResponse.data?.task_type_options;
        const isValidTaskTypeOptions = Array.isArray(taskTypeOptions);
        
        if (isValidTaskTypeOptions && taskTypeOptions.length > 0) {
          const filteredTaskTypes = taskTypesResponse.data?.filter(type => {
            return taskTypeOptions.includes(type.id);
          }) || [];
          setTaskTypes(filteredTaskTypes);
        } else {
          setTaskTypes(taskTypesResponse.data || []);
        }
        
        setPriorityLevels(priorityLevelsResponse.data || []);
        setComplexityLevels(complexityLevelsResponse.data || []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

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

    // Add a longer delay to prevent too many calculations when user is actively selecting options
    const timer = setTimeout(calculateSchedule, 800);
    return () => clearTimeout(timer);
  }, [
    form.watch('priorityLevelId'),
    form.watch('taskTypeId'),
    form.watch('complexityLevelId'),
    projectId,
    getTaskSchedule,
    form
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setImageFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const handleImagePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    if (items) {
      let pastedImage = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setImageFiles(prev => [...prev, blob]);
            pastedImage = true;
          }
        }
      }
      if (!pastedImage) {
        const text = e.clipboardData.getData('text/plain');
        if (text && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(text)) {
          const currentUrls = form.getValues("imageUrls");
          form.setValue("imageUrls", [...currentUrls, text]);
          setNewImageUrl("");
          pastedImage = true;
        }
      }
      if (pastedImage) {
        e.preventDefault();
      }
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addReferenceLink = () => {
    if (newReferenceLink && /^https?:\/\/.+/.test(newReferenceLink)) {
      const currentLinks = form.getValues("referenceLinks");
      form.setValue("referenceLinks", [...currentLinks, newReferenceLink]);
      setNewReferenceLink("");
    }
  };

  const removeReferenceLink = (index: number) => {
    const currentLinks = form.getValues("referenceLinks");
    form.setValue("referenceLinks", currentLinks.filter((_, i) => i !== index));
  };

  const addImageUrl = () => {
    if (newImageUrl && /^https?:\/\/.+/.test(newImageUrl)) {
      const currentUrls = form.getValues("imageUrls");
      form.setValue("imageUrls", [...currentUrls, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const removeImageUrl = (index: number) => {
    const currentUrls = form.getValues("imageUrls");
    form.setValue("imageUrls", currentUrls.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Important: Check if we have valid schedule data
      let taskScheduleData = scheduleData;
      
      // If we don't have schedule data yet, calculate it now and wait for the result
      if (!taskScheduleData || !taskScheduleData.initial_status_id) {
        console.log("No valid scheduleData available, calculating now...");
        setIsCalculatingSchedule(true);
        
        try {
          taskScheduleData = await getTaskSchedule({
            projectId,
            priorityLevelId: parseInt(data.priorityLevelId, 10),
            taskTypeId: parseInt(data.taskTypeId, 10),
            complexityLevelId: parseInt(data.complexityLevelId, 10)
          }, true); // Force update
          
          console.log("Got fresh schedule data:", taskScheduleData);
          
          // If we still don't have valid data, show error and return
          if (!taskScheduleData || !taskScheduleData.initial_status_id) {
            toast({
              title: "Unable to schedule task",
              description: "Could not determine task status. Please try again later.",
              variant: "destructive"
            });
            return;
          }
        } catch (error) {
          console.error("Error calculating task schedule:", error);
          toast({
            title: "Schedule calculation failed",
            description: "Could not determine task status. Please try again.",
            variant: "destructive"
          });
          return;
        } finally {
          setIsCalculatingSchedule(false);
        }
      }
      
      const uploadedImages: string[] = [];
      
      // Upload files if there are any
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
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
      
      // Combine uploaded images with image URLs
      const allImages = [...uploadedImages, ...data.imageUrls];
      
      // Add user ID (created_by) to the form data from the session
      const formData: any = {
        project_id: projectId,
        details: data.details,
        task_type_id: parseInt(data.taskTypeId, 10),
        priority_level_id: parseInt(data.priorityLevelId, 10),
        complexity_level_id: parseInt(data.complexityLevelId, 10),
        target_device: data.targetDevice,
        reference_links: data.referenceLinks,
        images: allImages,
        created_by: session?.user?.id, // Add the user ID from the session
      };
      
      // Add the est_start, est_end, and current_status_id from taskScheduleData if available
      if (taskScheduleData) {
        formData.est_start = taskScheduleData.est_start;
        formData.est_end = taskScheduleData.est_end;
        formData.current_status_id = taskScheduleData.initial_status_id;
        
        console.log("Using status ID from schedule data:", taskScheduleData.initial_status_id);
      } else {
        console.error("Missing schedule data, this should not happen at this point");
        return;
      }

      console.log("Submitting task with formData:", formData);

      const { error, data: insertedData } = await supabase
        .from('tasks')
        .insert(formData)
        .select();

      if (error) {
        console.error('Error creating task:', error);
        toast({
          title: "Error creating task",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log("Task created successfully:", insertedData);
      
      toast({
        title: "Task created",
        description: "The task has been created successfully."
      });
      
      // Show schedule notification
      toast({
        title: "Schedule Calculated",
        description: `Task scheduled to start at ${formatScheduleDate(taskScheduleData.est_start)} with status ID ${taskScheduleData.initial_status_id}`
      });
      
      onClose();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected error",
        description: "Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = form.formState.isValid;
  const errors = form.formState.errors;

  return (
    <div className="flex flex-col h-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
          <ScrollArea className="flex-1">
            {/* TaskScheduleInfo moved to the top of the form */}
            <div className="p-4">
              <TaskScheduleInfo
                estStart={scheduleData ? formatScheduleDate(scheduleData.est_start) : undefined}
                estEnd={scheduleData ? formatScheduleDate(scheduleData.est_end) : undefined}
                duration={scheduleData ? formatDuration(scheduleData.calculated_est_duration) : undefined}
                loading={scheduleLoading}
                error={scheduleError}
              />
            </div>
            
            <div className="space-y-5 p-4">
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what needs to be done..." 
                        className="min-h-[100px] focus:outline-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taskTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <SelectTrigger className={`text-muted-foreground ${errors.taskTypeId ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Task type" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#fcfcfc]">
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
                                <div className="px-2 py-1.5 text-xs font-semibold bg-muted">{categoryGroup.category}</div>
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
                
                <FormField
                  control={form.control}
                  name="complexityLevelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <SelectTrigger className="text-muted-foreground">
                            <SelectValue placeholder="Complexity" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#fcfcfc]">
                            {complexityLevels.map(level => (
                              <SelectItem key={level.id} value={String(level.id)}>
                                {level.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="targetDevice"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-5 mt-0 justify-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`flex items-center justify-center p-2 cursor-pointer ${field.value === 'desktop' ? 'text-black' : 'text-gray-300'}`} 
                              onClick={() => field.onChange('desktop')}
                            >
                              <Monitor size={24} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Desktop view only</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`flex items-center justify-center p-2 cursor-pointer ${field.value === 'mobile' ? 'text-black' : 'text-gray-300'}`} 
                              onClick={() => field.onChange('mobile')}
                            >
                              <Smartphone size={24} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mobile view only</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`flex items-center justify-center p-2 cursor-pointer ${field.value === 'both' ? 'text-black' : 'text-gray-300'}`} 
                              onClick={() => field.onChange('both')}
                            >
                              <MonitorSmartphone size={24} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Responsive - works on all devices</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-8 mb-8">
                <FormField
                  control={form.control}
                  name="priorityLevelId"
                  render={({ field }) => (
                    <FormItem className="mt-[30px] mb-[40px]">
                      <FormLabel className="text-gray-500 text-xs mb-4">
                        Priority Level
                      </FormLabel>
                      <div className="py-4 px-0 mt-2 border-t border-b border-gray-200">
                        <FormControl>
                          <div className="mt-1">
                            <PrioritySelector 
                              priorityLevels={priorityLevels} 
                              value={parseInt(field.value)} 
                              onChange={(value) => field.onChange(String(value))} 
                            />
                          </div>
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <div className="flex gap-2 mb-2">
                  <Input 
                    type="url" 
                    value={newReferenceLink} 
                    onChange={e => setNewReferenceLink(e.target.value)} 
                    placeholder="Paste reference link URL" 
                    className="flex-1" 
                  />
                  <Button type="button" size="icon" variant="outline" onClick={addReferenceLink}>
                    <Plus size={16} />
                  </Button>
                </div>
                {form.watch("referenceLinks").map((link, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <div className="flex-1 text-sm truncate">{link}</div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeReferenceLink(index)}>
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Input 
                      type="text" 
                      value={newImageUrl} 
                      onChange={e => setNewImageUrl(e.target.value)} 
                      placeholder="Upload or paste image/URL" 
                      className="pr-10 w-full" 
                      onPaste={handleImagePaste} 
                    />
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      id="image-upload" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                    <label htmlFor="image-upload" className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer">
                      <Upload size={16} className="text-gray-500 hover:text-gray-700" />
                    </label>
                  </div>
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="outline" 
                    onClick={addImageUrl} 
                    disabled={!newImageUrl}
                  >
                    <Plus size={16} />
                  </Button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                  {form.watch("imageUrls").map((url, index) => (
                    <div key={`url-${index}`} className="relative group">
                      <img 
                        src={url} 
                        alt="" 
                        className="w-[50px] h-[50px] object-cover rounded-md" 
                        onError={e => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50?text=Error';
                        }} 
                      />
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full" 
                        onClick={() => removeImageUrl(index)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                  {imageFiles.map((file, index) => (
                    <div key={`file-${index}`} className="relative group">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="" 
                        className="w-[50px] h-[50px] object-cover rounded-md" 
                      />
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full" 
                        onClick={() => removeImage(index)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <div className="border-t p-4 bg-background sticky bottom-0 z-10">
            <Button 
              type="submit" 
              disabled={isSubmitting || isCalculatingSchedule || !isFormValid} 
              className="w-full"
            >
              {isSubmitting || isCalculatingSchedule ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isCalculatingSchedule ? "Calculating Schedule..." : "Creating..."}
                </>
              ) : "Create Task"}
            </Button>
            {!isFormValid && Object.keys(errors).length > 0 && (
              <p className="text-red-500 text-xs mt-2 text-center">
                Please fill in all required fields correctly
              </p>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TaskForm;
