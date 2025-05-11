import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload, X, Plus, Monitor, Smartphone, MonitorSmartphone, Loader2 } from "lucide-react";
import { PrioritySelector } from "./PrioritySelector";
import { formatDuration, formatDateTime } from "@/lib/date-utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const taskFormSchema = z.object({
  details: z.string().max(1000, {
    message: "Task details must be less than 1000 characters"
  }),
  task_type_id: z.coerce.number({
    required_error: "Task type is required"
  }),
  priority_level_id: z.coerce.number().default(3),
  complexity_level_id: z.coerce.number().default(3),
  target_device: z.enum(["desktop", "mobile", "both"]).default("both"),
  reference_links: z.array(z.string().url({
    message: "Must be a valid URL"
  })).default([]),
  image_urls: z.array(z.string().url({
    message: "Must be a valid URL"
  })).default([])
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  onSubmit: (data: TaskFormValues) => void;
  isSubmitting: boolean;
  activeTaskCount: number;
}

export const TaskForm = ({
  onSubmit,
  isSubmitting,
  activeTaskCount
}: {
  onSubmit: (data: TaskFormValues) => void;
  isSubmitting: boolean;
  activeTaskCount: number;
}) => {
  const {
    id: projectId
  } = useParams<{
    id: string;
  }>();
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [priorityLevels, setPriorityLevels] = useState<any[]>([]);
  const [complexityLevels, setComplexityLevels] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [timelineParams, setTimelineParams] = useState<any>({
    taskTypeId: null,
    priorityLevelId: null,
    complexityLevelId: 3
  });
  const [newReferenceLink, setNewReferenceLink] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isEtaLoading, setIsEtaLoading] = useState(false);
  const [etaPreview, setEtaPreview] = useState<{
    projected_queue_position: number | null;
    estimated_start_time: string | null;
    estimated_end_time: string | null;
    estimated_duration: string | null;
  }>({
    projected_queue_position: null,
    estimated_start_time: null,
    estimated_end_time: null,
    estimated_duration: null
  });
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      details: "",
      complexity_level_id: 3,
      priority_level_id: 3,
      target_device: "both",
      reference_links: [],
      image_urls: []
    },
    mode: "onChange"
  });

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      const {
        data,
        error
      } = await supabase.from('projects').select(`
          id,
          name,
          task_type_options
        `).eq('id', projectId).single();
      if (error) {
        console.error("Error fetching project:", error);
        return;
      }
      setProject(data);
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const fetchTaskTypes = async () => {
      const {
        data,
        error
      } = await supabase.from('task_types').select('*').order('category').order('name');
      if (error) {
        console.error("Error fetching task types:", error);
        return;
      }
      if (project?.task_type_options && project.task_type_options.length > 0) {
        const filteredTaskTypes = data.filter(type => project.task_type_options.includes(type.id));
        setTaskTypes(filteredTaskTypes);
      } else {
        setTaskTypes(data);
      }
    };
    if (project) {
      fetchTaskTypes();
    }
  }, [project]);

  useEffect(() => {
    const fetchPriorityLevels = async () => {
      const {
        data,
        error
      } = await supabase.from('priority_levels').select('*').order('id');
      if (error) {
        console.error("Error fetching priority levels:", error);
        return;
      }
      setPriorityLevels(data);
    };
    fetchPriorityLevels();
  }, []);

  useEffect(() => {
    const fetchComplexityLevels = async () => {
      const {
        data,
        error
      } = await supabase.from('complexity_levels').select('*').eq('is_active', true).order('id');
      if (error) {
        console.error("Error fetching complexity levels:", error);
        return;
      }
      setComplexityLevels(data);
    };
    fetchComplexityLevels();
  }, []);

  const fetchTaskEta = async (taskTypeId: number, priorityLevelId: number, complexityLevelId: number) => {
    if (!projectId || !taskTypeId || !priorityLevelId || !complexityLevelId) return;
    
    setIsEtaLoading(true);
    try {
      console.log('Fetching ETA with params:', {
        project_id_param: projectId,
        priority_level_id_param: priorityLevelId,
        complexity_level_id_param: complexityLevelId,
        task_type_id_param: taskTypeId
      });
      
      const { data, error } = await supabase.rpc('calculate_project_task_eta', {
        project_id_param: projectId,
        priority_level_id_param: priorityLevelId,
        complexity_level_id_param: complexityLevelId,
        task_type_id_param: taskTypeId
      });
      
      if (error) {
        console.error("Error fetching task ETA:", error);
        setEtaPreview({
          projected_queue_position: null,
          estimated_start_time: null,
          estimated_end_time: null,
          estimated_duration: null
        });
        return;
      }
      
      console.log('ETA data received:', data);
      
      if (data && data.length > 0) {
        setEtaPreview({
          projected_queue_position: data[0].projected_queue_position,
          estimated_start_time: data[0].estimated_start_time ? String(data[0].estimated_start_time) : null,
          estimated_end_time: data[0].estimated_end_time ? String(data[0].estimated_end_time) : null,
          estimated_duration: data[0].estimated_duration ? String(data[0].estimated_duration) : null
        });
      } else {
        // Reset preview if no data returned
        setEtaPreview({
          projected_queue_position: null,
          estimated_start_time: null,
          estimated_end_time: null,
          estimated_duration: null
        });
      }
    } catch (error) {
      console.error("Error in fetchTaskEta:", error);
      // Reset preview on error
      setEtaPreview({
        projected_queue_position: null,
        estimated_start_time: null,
        estimated_end_time: null,
        estimated_duration: null
      });
    } finally {
      setIsEtaLoading(false);
    }
  };

  useEffect(() => {
    const subscription = form.watch(value => {
      const newParams = {
        taskTypeId: value.task_type_id,
        priorityLevelId: value.priority_level_id,
        complexityLevelId: value.complexity_level_id || 3
      };
      
      setTimelineParams(newParams);

      // Only call fetchTaskEta when all three required values are present
      if (newParams.taskTypeId && newParams.priorityLevelId && newParams.complexityLevelId) {
        console.log('Params changed, fetching new ETA:', newParams);
        fetchTaskEta(
          newParams.taskTypeId, 
          newParams.priorityLevelId, 
          newParams.complexityLevelId
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, projectId]);

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
          form.setValue("image_urls", [...form.getValues("image_urls"), text]);
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
      const currentLinks = form.getValues("reference_links");
      form.setValue("reference_links", [...currentLinks, newReferenceLink]);
      setNewReferenceLink("");
    }
  };

  const removeReferenceLink = (index: number) => {
    const currentLinks = form.getValues("reference_links");
    form.setValue("reference_links", currentLinks.filter((_, i) => i !== index));
  };

  const addImageUrl = () => {
    if (newImageUrl && /^https?:\/\/.+/.test(newImageUrl)) {
      const currentUrls = form.getValues("image_urls");
      form.setValue("image_urls", [...currentUrls, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const removeImageUrl = (index: number) => {
    const currentUrls = form.getValues("image_urls");
    form.setValue("image_urls", currentUrls.filter((_, i) => i !== index));
  };

  const getPriorityTooltip = (level: any) => {
    if (!level) return "";
    const timeToStart = level.start_delay !== undefined ? formatDuration(level.start_delay) : "immediate";
    const multiplier = level.multiplier ? `${level.multiplier}x duration` : "standard duration";
    return `${timeToStart} delay, ${multiplier}`;
  };

  const handleFormSubmit = (data: TaskFormValues) => {
    console.log("Form submission data:", data);
    if (!form.formState.isValid) {
      console.error("Form is invalid, not submitting");
      return;
    }
    onSubmit(data);
  };

  const isFormValid = form.formState.isValid;
  const errors = form.formState.errors;
  
  return <div className="flex flex-col h-full">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col h-full">
        <ScrollArea className="flex-1">
          <div className="space-y-5 p-4">
            <FormField control={form.control} name="details" render={({
              field
            }) => <FormItem>
              <FormControl>
                <Textarea placeholder="Describe what needs to be done..." className="min-h-[100px] focus:outline-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>} />

            <div className="grid grid-cols-2 gap-4 ">
              <FormField control={form.control} name="task_type_id" render={({
                field
              }) => <FormItem>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                    <SelectTrigger className={`text-muted-foreground ${errors.task_type_id ? 'border-red-500' : ''}`}>
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
                      }, []).map((categoryGroup: any) => <div key={categoryGroup.category} className="mb-2">
                            <div className="px-2 py-1.5 text-xs font-semibold bg-muted">{categoryGroup.category}</div>
                            {categoryGroup.items.map((type: any) => <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                              </SelectItem>)}
                          </div>)}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>} />
            
              <FormField control={form.control} name="complexity_level_id" render={({
                field
              }) => <FormItem>
                <FormControl>
                  <Select onValueChange={value => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                    <SelectTrigger className="text-muted-foreground">
                      <SelectValue placeholder="Complexity" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#fcfcfc]">
                      {complexityLevels.map(level => <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>} />
            </div>

            <FormField control={form.control} name="target_device" render={({
              field
            }) => <FormItem>
                <div className="flex gap-5 mt-0 justify-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`flex items-center justify-center p-2 cursor-pointer ${field.value === 'desktop' ? 'text-black' : 'text-gray-300'}`} onClick={() => field.onChange('desktop')}>
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
                        <div className={`flex items-center justify-center p-2 cursor-pointer ${field.value === 'mobile' ? 'text-black' : 'text-gray-300'}`} onClick={() => field.onChange('mobile')}>
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
                        <div className={`flex items-center justify-center p-2 cursor-pointer ${field.value === 'both' ? 'text-black' : 'text-gray-300'}`} onClick={() => field.onChange('both')}>
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
              </FormItem>} />

            <div className="mt-8 mb-8">
              <FormField control={form.control} name="priority_level_id" render={({
                field
              }) => <FormItem className="mt-[30px] mb-[40px]">
                <FormLabel className="text-gray-500 text-xs mb-4">
                  Priority Level
                </FormLabel>
                <div className="py-4 px-0 mt-2 border-t border-b border-gray-200">
                  <FormControl>
                    <div className="mt-1">
                      <PrioritySelector priorityLevels={priorityLevels} value={field.value} onChange={field.onChange} />
                    </div>
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>} />
            </div>

            <div>
              <div className="flex gap-2 mb-2">
                <Input type="url" value={newReferenceLink} onChange={e => setNewReferenceLink(e.target.value)} placeholder="Paste reference link URL" className="flex-1" />
                <Button type="button" size="icon" variant="outline" onClick={addReferenceLink}>
                  <Plus size={16} />
                </Button>
              </div>
              {form.watch("reference_links").map((link, index) => <div key={index} className="flex items-center gap-2 mb-2">
                  <div className="flex-1 text-sm truncate">{link}</div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeReferenceLink(index)}>
                    <X size={14} />
                  </Button>
                </div>)}
            </div>

            <div>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Input type="text" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="Upload or paste image/URL" className="pr-10 w-full" onPaste={handleImagePaste} />
                  <input type="file" accept="image/*" multiple id="image-upload" className="hidden" onChange={handleImageUpload} />
                  <label htmlFor="image-upload" className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer">
                    <Upload size={16} className="text-gray-500 hover:text-gray-700" />
                  </label>
                </div>
                <Button type="button" size="icon" variant="outline" onClick={addImageUrl} disabled={!newImageUrl}>
                  <Plus size={16} />
                </Button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                {form.watch("image_urls").map((url, index) => <div key={`url-${index}`} className="relative group">
                    <img src={url} alt="" className="w-[50px] h-[50px] object-cover rounded-md" onError={e => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50?text=Error';
                    }} />
                    <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full" onClick={() => removeImageUrl(index)}>
                      <X size={12} />
                    </Button>
                  </div>)}
                {imageFiles.map((file, index) => <div key={`file-${index}`} className="relative group">
                    <img src={URL.createObjectURL(file)} alt="" className="w-[50px] h-[50px] object-cover rounded-md" />
                    <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full" onClick={() => removeImage(index)}>
                      <X size={12} />
                    </Button>
                  </div>)}
              </div>
            </div>
            
            {/* Task Timeline Preview Section */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium mb-2">Task Timeline Preview</h3>
              {isEtaLoading ? (
                <div className="flex items-center justify-center p-3 bg-blue-50 rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">Calculating...</span>
                </div>
              ) : etaPreview.projected_queue_position !== null ? (
                <div className="bg-blue-50 rounded-md p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Queue Position:</span>
                    <span className="font-medium">{etaPreview.projected_queue_position}</span>
                  </div>
                  {etaPreview.estimated_start_time && (
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Estimated Start:</span>
                      <span className="font-medium">{formatDateTime(etaPreview.estimated_start_time)}</span>
                    </div>
                  )}
                  {etaPreview.estimated_end_time && (
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Estimated End:</span>
                      <span className="font-medium">{formatDateTime(etaPreview.estimated_end_time)}</span>
                    </div>
                  )}
                  {etaPreview.estimated_duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{formatDuration(etaPreview.estimated_duration)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-md">
                  Select task type, priority, and complexity to see estimation
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="border-t p-4 bg-background sticky bottom-0 z-10">
          <Button 
            type="submit" 
            disabled={isSubmitting || !isFormValid} 
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
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
  </div>;
};
