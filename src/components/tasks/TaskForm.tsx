
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
import { TimelineVisualization } from "./TimelineVisualization";
import { HelpCircle, Monitor, Smartphone, MonitorSmartphone, Upload, Link, X } from "lucide-react";
import { formatDuration } from "@/lib/date-utils";
import { Slider } from "@/components/ui/slider";
import { PriorityDial } from "./PriorityDial";

const taskFormSchema = z.object({
  details: z.string().min(10, {
    message: "Task details must be at least 10 characters"
  }).max(1000, {
    message: "Task details must be less than 1000 characters"
  }),
  task_type_id: z.coerce.number(),
  priority_level_id: z.coerce.number(),
  complexity_level_id: z.coerce.number().default(3),
  target_device: z.enum(["Desktop", "Mobile", "Both"]).default("Both"),
  reference_links: z.array(z.string().url({
    message: "Must be a valid URL"
  })).optional(),
  image_url: z.string().url({
    message: "Must be a valid URL"
  }).optional().or(z.string().length(0))
});

type TaskFormValues = z.infer<typeof taskFormSchema>;
interface TaskFormProps {
  onSubmit: (data: TaskFormValues) => void;
  isSubmitting: boolean;
  queuePosition: number;
}

export const TaskForm = ({
  onSubmit,
  isSubmitting,
  queuePosition
}: TaskFormProps) => {
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      details: "",
      complexity_level_id: 3,
      target_device: "Both",
      image_url: ""
    }
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

  useEffect(() => {
    const subscription = form.watch(value => {
      setTimelineParams({
        taskTypeId: value.task_type_id,
        priorityLevelId: value.priority_level_id,
        complexityLevelId: value.complexity_level_id || 3
      });
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const handleFormSubmit = (values: TaskFormValues) => {
    if (imageFile) {
      console.log("Image file to upload:", imageFile);
    }
    onSubmit(values);
  };

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

  const getPriorityTooltip = (level: any) => {
    if (!level) return "";
    const timeToStart = level.time_to_start ? formatDuration(level.time_to_start) : "immediate";
    const multiplier = level.multiplier ? `${level.multiplier}x duration` : "standard duration";
    return `${timeToStart} delay, ${multiplier}`;
  };

  const getSelectedComplexityName = () => {
    const complexityId = form.watch("complexity_level_id");
    const selectedLevel = complexityLevels.find(level => level.id === complexityId);
    return selectedLevel?.name || "Standard";
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      form.setValue("image_url", "");
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue("image_url", url);
    setImageFile(null);
    setImagePreview(url);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    form.setValue("image_url", "");
  };

  return <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <TimelineVisualization 
          taskTypeId={timelineParams.taskTypeId} 
          priorityLevelId={timelineParams.priorityLevelId} 
          complexityLevelId={timelineParams.complexityLevelId} 
          projectId={projectId}
          compact={true} 
        />

        <div className="space-y-5 pt-2">
          <FormField control={form.control} name="details" render={({
          field
        }) => <FormItem>
                <FormControl>
                  <Textarea placeholder="Describe what needs to be done..." className="min-h-[120px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="task_type_id" render={({
            field
          }) => <FormItem>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
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
            
            <FormField control={form.control} name="target_device" render={({
            field
          }) => <FormItem>
                  <div className="flex gap-5 mt-0 justify-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`flex items-center justify-center p-2 cursor-pointer ${field.value === 'Desktop' ? 'text-black' : 'text-gray-300'}`} onClick={() => field.onChange('Desktop')}>
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
                          <div className={`flex items-center justify-center p-2 cursor-pointer ${field.value === 'Mobile' ? 'text-black' : 'text-gray-300'}`} onClick={() => field.onChange('Mobile')}>
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
                          <div className={`flex items-center justify-center p-2 cursor-pointer ${field.value === 'Both' ? 'text-black' : 'text-gray-300'}`} onClick={() => field.onChange('Both')}>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="priority_level_id" render={({
            field
            }) => <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Priority Level</FormLabel>
                  <FormControl>
                    <div className="mt-1">
                      <PriorityDial 
                        priorityLevels={priorityLevels} 
                        value={field.value} 
                        onChange={field.onChange}
                        compact={true}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="complexity_level_id" render={({
            field
            }) => <FormItem className="space-y-2">
                  <FormLabel className="text-xs text-muted-foreground">Complexity Level</FormLabel>
                  <FormControl>
                    <div className="pt-1">
                      <Slider min={1} max={5} step={1} value={[field.value || 3]} onValueChange={vals => field.onChange(vals[0])} className="w-full" />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>Basic</span>
                        <span>Easy</span>
                        <span>Standard</span>
                        <span>Advanced</span>
                        <span>Complex</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>} />
          </div>

          <FormItem>
            <FormLabel>Image Reference (Optional)</FormLabel>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative border border-input rounded-md p-2 flex-1">
                  <Input type="url" placeholder="Paste image URL here" value={form.watch("image_url") || ""} onChange={handleImageUrlChange} className="border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
                  <div className="absolute right-2 top-2.5 text-muted-foreground">
                    <Link size={16} />
                  </div>
                </div>
                <div className="relative">
                  <input type="file" accept="image/*" id="image-upload" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} />
                  <Button type="button" variant="outline" className="h-10 px-3 gap-2">
                    <Upload size={16} />
                    <span className="sr-only sm:not-sr-only">Upload</span>
                  </Button>
                </div>
              </div>
              
              {imagePreview && <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="max-h-40 rounded-md border border-input" />
                  <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full" onClick={clearImage}>
                    <X size={14} />
                  </Button>
                </div>}
            </div>
          </FormItem>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full mt-6">
          {isSubmitting ? "Creating..." : `Create Task (#${queuePosition + 1})`}
        </Button>
      </form>
    </Form>;
};
