
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Monitor, Smartphone, ArrowUp, ArrowDown, Maximize, Link2 } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLayout } from "@/context/layout";
import TaskCommentThread from "./comments/TaskCommentThread";
import ImageViewerDialog from "./ImageViewerDialog";

interface TasksTableProps {
  projectId: string;
  selectedMonth: string;
  statusFilter: string;
  maxConcurrentTasks: number;
}

const TasksTable = ({ projectId, selectedMonth, statusFilter, maxConcurrentTasks }: TasksTableProps) => {
  const { setRightSidebarContent } = useLayout();
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc' as 'asc' | 'desc'
  });
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Build filter based on status
  const getStatusFilter = () => {
    if (statusFilter === 'all') return {}; 
    if (statusFilter === 'active') return {
      // Return active statuses (1=Open, 2=Pending, 3=In Progress, 6=Awaiting Input)
      current_status_id: { in: '1,2,3,6' }
    };
    if (statusFilter === 'completed') return {
      // Return completed status (8=Done)
      current_status_id: 8
    };
    return {};
  };

  // Parse month for filtering
  const getMonthFilter = () => {
    if (!selectedMonth) return {};
    
    const [year, month] = selectedMonth.split('-');
    const startDate = `${year}-${month}-01`;
    
    // Calculate end date
    const endMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
    const endYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
    
    return {
      created_at: {
        gte: startDate,
        lt: endDate
      }
    };
  };

  // Fetch tasks with sorting and filtering
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', projectId, sortConfig, statusFilter, selectedMonth],
    queryFn: async () => {
      console.log('Fetching tasks with filters:', getStatusFilter(), 'and month:', getMonthFilter());
      console.log('Max concurrent tasks:', maxConcurrentTasks);
      
      let query = supabase
        .from('tasks')
        .select(`
          *,
          task_type:task_types(*),
          status:task_statuses(*),
          priority:priority_levels(*),
          complexity:complexity_levels(*),
          assigned_user:user_profiles(first_name, last_name)
        `)
        .eq('project_id', projectId)
        .order(sortConfig.key, { ascending: sortConfig.direction === 'asc' });
      
      // Apply status filter if any
      const statusFilterObj = getStatusFilter();
      if (statusFilterObj.current_status_id) {
        if (typeof statusFilterObj.current_status_id === 'object' && 'in' in statusFilterObj.current_status_id) {
          query = query.in('current_status_id', statusFilterObj.current_status_id.in.split(',').map(Number));
        } else {
          query = query.eq('current_status_id', statusFilterObj.current_status_id);
        }
      }
      
      // Apply month filter if any
      const monthFilterObj = getMonthFilter();
      if (monthFilterObj.created_at) {
        query = query
          .gte('created_at', monthFilterObj.created_at.gte)
          .lt('created_at', monthFilterObj.created_at.lt);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      return data;
    }
  });

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleImageClick = (image: string, images: string[]) => {
    setCurrentImages(images);
    setCurrentImageIndex(images.indexOf(image));
    setImageViewerOpen(true);
  };
  
  const handleCommentClick = (taskId: string) => {
    setRightSidebarContent(<TaskCommentThread taskId={taskId} />);
  };

  if (isLoading) {
    return <div className="py-10 text-center">Loading tasks...</div>;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-500">No tasks found for the selected filters.</p>
      </div>
    );
  }

  const formatETA = (date: string) => {
    return format(new Date(date), "h.mmaaa do MMM");
  };

  // Fix type issues by providing default values for null or undefined status
  const getStatusColor = (status: { name: string | null, color_hex: string | null } | null) => {
    // Default values if status is null or undefined
    if (!status) {
      return { bg: '#F3F4F6', text: '#374151' };
    }

    // Default values if color_hex is null
    if (!status.color_hex) {
      return { bg: '#F3F4F6', text: '#374151' };
    }

    const [bgColor, textColor] = status.color_hex.split(',').map(color => color.trim());
    
    if (bgColor && textColor) {
      return {
        bg: bgColor,
        text: textColor
      };
    }
    
    const hex = status.color_hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const max = Math.max(r, g, b);
    
    const saturationMultiplier = 1.3;
    const darkenFactor = 0.8;
    
    const newR = r === max ? Math.min(255, r * saturationMultiplier * darkenFactor) : r * darkenFactor;
    const newG = g === max ? Math.min(255, g * saturationMultiplier * darkenFactor) : g * darkenFactor;
    const newB = b === max ? Math.min(255, b * saturationMultiplier * darkenFactor) : b * darkenFactor;
    
    const enhancedColor = `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;

    return {
      bg: status.color_hex,
      text: enhancedColor
    };
  };

  const getComplexityBars = (complexity: { name: string, multiplier: number } | null) => {
    if (!complexity) return 1;
    
    const complexityMap: { [key: string]: number } = {
      'Basic': 1,
      'Standard': 2,
      'Advanced': 3,
      'Complex': 4,
      'Very Complex': 5,
      'Extreme': 6
    };

    return complexityMap[complexity.name] || 1;
  };

  const getPriorityColor = (priority: { name: string, color: string } | null) => {
    if (!priority) return '#9CA3AF';

    const priorityColors: { [key: string]: string } = {
      'Very Low': '#6EE7B7',
      'Low': '#22C55E',
      'Normal': '#FBBF24',
      'Medium': '#F97316',
      'High': '#EF4444',
      'Critical': '#B91C1C'
    };

    return priorityColors[priority.name] || priority.color || '#9CA3AF'; 
  };

  const renderReferenceLinks = (links: Record<string, string> | null) => {
    if (!links) return null;
    
    return Object.entries(links).map(([text, url], index) => (
      <a
        key={index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-gray-800 hover:text-gray-600"
      >
        <Link2 className="w-3 h-3" />
        {text}
      </a>
    ));
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('current_status_id')}
            >
              Status {sortConfig.key === 'current_status_id' && (
                sortConfig.direction === 'asc' ? <ArrowUp className="inline w-4 h-4" /> : <ArrowDown className="inline w-4 h-4" />
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('details')}
            >
              Details
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('target_device')}
            >
              Device
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('priority_level_id')}
            >
              Priority
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('complexity_level_id')}
            >
              Level
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('eta')}
            >
              ETA
            </TableHead>
            <TableHead>Links</TableHead>
            <TableHead>Assets</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow 
              key={task.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleCommentClick(task.id)}
            >
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <span 
                    className="px-2 py-1 text-xs rounded-full font-semibold"
                    style={{
                      backgroundColor: getStatusColor(task.status).bg,
                      color: getStatusColor(task.status).text
                    }}
                  >
                    {task.status?.name === 'Open' ? 'Starts at' : task.status?.name}
                  </span>
                  {task.task_completed_at && task.actual_hours_spent && (
                    <span className="text-xs text-gray-500 pl-2">
                      {task.actual_hours_spent} hrs
                    </span>
                  )}
                  {task.status?.name === 'Open' && task.start_time && (
                    <span className="text-xs text-gray-500 pl-2">
                      {format(new Date(task.start_time), "h:mmaaa d MMM")}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex-1 min-w-0 max-w-[350px]">
                  <p className="text-sm break-words">{task.details}</p>
                  <p className="text-xs text-gray-500 mt-1">{task.task_type?.name}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {task.target_device === 'Desktop' && <Monitor className="w-4 h-4 text-gray-500" />}
                  {task.target_device === 'Mobile' && <Smartphone className="w-4 h-4 text-gray-500" />}
                  {task.target_device === 'Both' && (
                    <>
                      <Monitor className="w-4 h-4 text-gray-500" />
                      <Smartphone className="w-4 h-4 text-gray-500" />
                    </>
                  )}
                </div>
              </TableCell>  
              <TableCell>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  />
                  <span className="text-xs text-gray-700">
                    {task.priority?.name || 'Not set'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex gap-0.5">
                        {[...Array(6)].map((_, index) => (
                          <div
                            key={index}
                            className={`w-1 h-4 rounded-sm ${
                              index < getComplexityBars(task.complexity)
                                ? 'bg-gray-600'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#fcfcfc]">
                      <p>{task.complexity?.name || 'Not set'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-left">
                {task.eta ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-600">{format(new Date(task.eta), "h.mmaaa")}</span>
                    <span className="text-xs text-gray-700">{format(new Date(task.eta), "do MMM")}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-700">Not set</span>
                )}
              </TableCell>
              
              <TableCell>
                <div className="flex flex-col gap-1">
                  {task.reference_links && renderReferenceLinks(task.reference_links as Record<string, string>)}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex -space-x-2">
                  {task.images && Array.isArray(task.images) && task.images.length > 0 && (
                    task.images.map((image, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 relative cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageClick(image as string, task.images as string[]);
                        }}
                      >
                        <img 
                          src={image as string}
                          alt={`Task image ${index + 1}`}
                          className="w-8 h-8 rounded-lg border-2 border-white object-cover"
                        />
                        <Maximize className="w-3 h-3 absolute top-0 right-0 text-gray-600 bg-white rounded-full p-0.5" />
                      </div>
                    ))
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {imageViewerOpen && (
        <ImageViewerDialog
          images={currentImages}
          initialIndex={currentImageIndex}
          open={imageViewerOpen}
          onOpenChange={setImageViewerOpen}
        />
      )}
    </>
  );
};

export default TasksTable;
