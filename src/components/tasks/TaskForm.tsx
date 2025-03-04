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
import { Upload, X, Link as LinkIcon, Plus } from "lucide-react";
import { PriorityDial } from "./PriorityDial";
import { formatDuration } from "@/lib/date-utils";

// Update the schema to support arrays of URLs
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
  })).default([]),
  image_urls: z.array(z.string().url({
    message: "Must be a valid URL"
  })).default([])
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
  const { id: projectId } = useParams<{ id: string }>();
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

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      details: "",
      complexity_level_id: 3,
      target_device: "Both",
      reference_links: [],
      image_urls: []
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setImageFiles(prev => [...prev, ...Array.from(files)]);
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

  return <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <TimelineVisualization 
          taskTypeId={timelineParams.taskTypeId} 
          priorityLevelId={timelineParams.priorityLevelId} 
          complexityLevelId={timelineParams.complexityLevelId} 
          projectId={projectId}
          compact={true} 
        />

        <div className="space-y-5 pt-2">
          <FormField control={form.control} name="details" render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea 
                  placeholder="Describe what needs to be done..." 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="task_type_id" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Task type" />
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
              </FormItem>
            )} />
            
            <FormField control={form.control} name="complexity_level_id" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      {complexityLevels.map(level => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          
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

          {/* Reference Links */}
          <div>
            <div className="flex gap-2 mb-2">
              <Input
                type="url"
                value={newReferenceLink}
                onChange={(e) => setNewReferenceLink(e.target.value)}
                placeholder="Paste reference link URL"
                className="flex-1"
              />
              <Button type="button" size="icon" variant="outline" onClick={addReferenceLink}>
                <Plus size={16} />
              </Button>
            </div>
            {form.watch("reference_links").map((link, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <div className="flex-1 text-sm truncate">{link}</div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeReferenceLink(index)}>
                  <X size={14} />
                </Button>
              </div>
            ))}
          </div>

          {/* Image URLs and Uploads */}
          <div>
            <div className="flex gap-2 mb-2">
              <Input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste image URL"
                className="flex-1"
              />
              <Button type="button" size="icon" variant="outline" onClick={addImageUrl}>
                <Plus size={16} />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {form.watch("image_urls").map((url, index) => (
                <div key={index} className="relative group">
                  <img src={url} alt="" className="w-full h-24 object-cover rounded-md" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={() => removeImageUrl(index)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
              {imageFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-24 object-cover rounded-md" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={() => removeImage(index)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                multiple
                id="image-upload"
                className="hidden"
                onChange={handleImageUpload}
              />
              <label htmlFor="image-upload">
                <Button type="button" variant="outline" className="w-full" asChild>
                  <span>
                    <Upload size={16} />
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full mt-6">
          {isSubmitting ? "Creating..." : `Create Task (#${queuePosition + 1})`}
        </Button>
      </form>
    </Form>;
};
