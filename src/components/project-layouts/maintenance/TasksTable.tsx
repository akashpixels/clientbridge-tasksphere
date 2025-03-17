
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
import { Badge } from "@/components/ui/badge";
import TaskCommentThread from "./comments/TaskCommentThread";

interface TasksTableProps {
  tasks: (Tables<"tasks"> & {
    task_type: {
      name: string;
      category: string;
    } | null;
    status: {
      name: string;
      color_hex: string | null;
    } | null;
    priority: {
      name: string;
      color: string;
    } | null;
    complexity: {
      name: string;
      multiplier: number;
    } | null;
    assigned_user: {
      first_name: string;
      last_name: string;
    } | null;
    task_code?: string;
    queue_position?: number;
    is_awaiting_input?: boolean;
    is_onhold?: boolean;
    start_time?: string | null;
    eta?: string | null;
    reference_links?: Record<string, string> | null;
  })[];
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc';
  };
  onSort: (key: string) => void;
  onImageClick: (image: string, images: string[]) => void;
  onCommentClick: (taskId: string) => void;
  selectedTaskId?: string;
}

const TasksTable = ({ 
  tasks, 
  sortConfig, 
  onSort, 
  onImageClick, 
  onCommentClick,
  selectedTaskId 
}: TasksTableProps) => {
  const { setRightSidebarContent } = useLayout();

  const formatETA = (date: string) => {
    return format(new Date(date), "h.mmaaa do MMM");
  };

  const formatDateTime = (date: string) => {
    return format(new Date(date), "MMM d, h:mm a");
  };

  const getStatusColor = (status: { name: string | null, color_hex: string | null }, is_awaiting_input?: boolean, is_onhold?: boolean) => {
    if (is_awaiting_input) {
      return { bg: '#FEF9C3', text: '#854D0E' }; // Light yellow
    }
    
    if (is_onhold) {
      return { bg: '#FDE68A', text: '#92400E' }; // Darker yellow
    }

    if (!status?.color_hex) {
      return { bg: '#F3F4F6', text: '#374151' }; // Default gray
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

  const getImagesArray = (images: unknown): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) {
      return images.filter((img): img is string => typeof img === 'string');
    }
    return [];
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead 
            className="cursor-pointer"
            onClick={() => onSort('task_code')}
          >
            Task Code {sortConfig.key === 'task_code' && (
              sortConfig.direction === 'asc' ? <ArrowUp className="inline w-4 h-4" /> : <ArrowDown className="inline w-4 h-4" />
            )}
          </TableHead>
          <TableHead 
            className="cursor-pointer"
            onClick={() => onSort('status')}
          >
            Status {sortConfig.key === 'status' && (
              sortConfig.direction === 'asc' ? <ArrowUp className="inline w-4 h-4" /> : <ArrowDown className="inline w-4 h-4" />
            )}
          </TableHead>
          <TableHead 
            className="cursor-pointer"
            onClick={() => onSort('details')}
          >
            Details
          </TableHead>
          <TableHead 
            className="cursor-pointer"
            onClick={() => onSort('target_device')}
          >
            Device
          </TableHead>
          <TableHead 
            className="cursor-pointer"
            onClick={() => onSort('priority_level_id')}
          >
            Priority
          </TableHead>
          <TableHead 
            className="cursor-pointer"
            onClick={() => onSort('complexity_level_id')}
          >
            Level
          </TableHead>
          <TableHead 
            className="cursor-pointer"
            onClick={() => onSort('start_time')}
          >
            Start Time {sortConfig.key === 'start_time' && (
              sortConfig.direction === 'asc' ? <ArrowUp className="inline w-4 h-4" /> : <ArrowDown className="inline w-4 h-4" />
            )}
          </TableHead>
          <TableHead 
            className="cursor-pointer"
            onClick={() => onSort('eta')}
          >
            ETA {sortConfig.key === 'eta' && (
              sortConfig.direction === 'asc' ? <ArrowUp className="inline w-4 h-4" /> : <ArrowDown className="inline w-4 h-4" />
            )}
          </TableHead>
          <TableHead>Links</TableHead>
          <TableHead>Assets</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow 
            key={task.id}
            className={`cursor-pointer ${selectedTaskId === task.id ? 'bg-muted/30' : 'hover:bg-muted/30'}`}
            onClick={() => {
              onCommentClick(task.id);
              setRightSidebarContent(
                <TaskCommentThread 
                  taskId={task.id} 
                  taskCode={task.task_code || 'No Code'} 
                />
              );
            }}
          >
            <TableCell>
              <Badge 
                variant="outline" 
                className="font-mono text-xs"
              >
                {task.task_code || '—'}
                {task.queue_position && (
                  <span className="ml-1 text-[10px] bg-gray-100 px-1 rounded-full">
                    #{task.queue_position}
                  </span>
                )}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-col items-start gap-1">
                <span 
                  className="px-2 py-1 text-xs rounded-full font-semibold"
                  style={{
                    backgroundColor: getStatusColor(task.status || { name: null, color_hex: null }, task.is_awaiting_input, task.is_onhold).bg,
                    color: getStatusColor(task.status || { name: null, color_hex: null }, task.is_awaiting_input, task.is_onhold).text
                  }}
                >
                  {task.is_awaiting_input ? 'Awaiting Input' : task.is_onhold ? 'On Hold' : task.status?.name}
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
                {task.target_device === 'desktop' && <Monitor className="w-4 h-4 text-gray-500" />}
                {task.target_device === 'mobile' && <Smartphone className="w-4 h-4 text-gray-500" />}
                {task.target_device === 'both' && (
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
              {task.start_time ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">{format(new Date(task.start_time), "h:mm a")}</span>
                  <span className="text-xs text-gray-700">{format(new Date(task.start_time), "MMM d")}</span>
                </div>
              ) : (
                <span className="text-xs text-gray-700">Not set</span>
              )}
            </TableCell>
            
            <TableCell className="text-left">
              {task.eta ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">{format(new Date(task.eta), "h:mm a")}</span>
                  <span className="text-xs text-gray-700">{format(new Date(task.eta), "MMM d")}</span>
                </div>
              ) : (
                <span className="text-xs text-gray-700">Not set</span>
              )}
            </TableCell>
            
            <TableCell>
              <div className="flex flex-col gap-1">
                {task.reference_links && renderReferenceLinks(task.reference_links)}
              </div>
            </TableCell>

            <TableCell>
              <div className="flex -space-x-2">
                {task.images && (
                  getImagesArray(task.images).map((image, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 relative cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageClick(image, getImagesArray(task.images));
                      }}
                    >
                      <img 
                        src={image}
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
  );
};

export default TasksTable;
