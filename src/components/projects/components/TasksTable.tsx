
import { Tables } from "@/integrations/supabase/types";
import { Monitor, Smartphone, Maximize, Link2 } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLayout } from "@/context/layout";
import { Badge } from "@/components/ui/badge";
import TaskCommentThread from "./comments/TaskCommentThread";
import { Separator } from "@/components/ui/separator";

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
      color_hex: string;
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
    est_start?: string | null;
    est_end?: string | null;
    actual_duration?: number | null; 
    logged_duration?: number | null; 
    completed_at?: string | null;
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

const formatInterval = (intervalValue: any): string => {
  if (!intervalValue) return "0h";
  if (typeof intervalValue === 'number') {
    return intervalValue === 0 ? "0h" : `${intervalValue}h`;
  }
  try {
    if (typeof intervalValue === 'string') {
      if (intervalValue.includes(':')) {
        const parts = intervalValue.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const minutesAsHours = minutes / 60;
        return `${(hours + minutesAsHours).toFixed(1).replace(/\.0$/, '')}h`;
      } else if (intervalValue.includes('hours') || intervalValue.includes('hour')) {
        const hoursMatch = intervalValue.match(/(\d+)\s+hours?/);
        const minutesMatch = intervalValue.match(/(\d+)\s+minutes?/);
        const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
        const minutesAsHours = minutes / 60;
        return `${(hours + minutesAsHours).toFixed(1).replace(/\.0$/, '')}h`;
      }
      return `${parseFloat(intervalValue)}h`;
    }
    if (typeof intervalValue === 'object' && intervalValue !== null) {
      const stringValue = String(intervalValue);
      return formatInterval(stringValue);
    }
    return "0h";
  } catch (e) {
    console.error("Error formatting interval:", e, intervalValue);
    return "0h";
  }
};

// Updated function to group tasks by task_statuses.type and critical priority
const getTaskGroup = (task: any) => {
  // First check for critical tasks (priority_level_id = 1)
  if (task.priority_level_id === 1) {
    return 'critical';
  }
  
  const statusType = (task.status?.type || '').toLowerCase();
  
  if (statusType === 'active') {
    return 'active';
  }
  if (statusType === 'scheduled') {
    return 'scheduled';
  }
  if (statusType === 'completed') {
    return 'completed';
  }
  return 'special'; // Any other type
};

const getGroupLabel = (groupId: string) => {
  switch (groupId) {
    case 'critical':
      return "Critical Tasks";
    case 'active':
      return "Active Tasks";
    case 'scheduled':
      return "Scheduled Tasks";
    case 'completed':
      return "Completed Tasks";
    case 'special':
      return "Other Tasks";
    default:
      return "Tasks";
  }
};

const TasksTable = ({
  tasks,
  sortConfig,
  onSort,
  onImageClick,
  onCommentClick,
  selectedTaskId
}: TasksTableProps) => {
  const {
    setRightSidebarContent
  } = useLayout();

  const groupedTasks: Record<string, typeof tasks> = {
    critical: [],
    active: [],
    scheduled: [],
    completed: [],
    special: []
  };

  tasks.forEach(task => {
    const group = getTaskGroup(task);
    groupedTasks[group].push(task);
  });

  const renderTaskRow = (task: typeof tasks[0]) => (
    <TableRow 
      key={task.id} 
      className={`cursor-pointer ${selectedTaskId === task.id ? 'bg-muted/30' : 'hover:bg-muted/30'}`} 
      onClick={() => {
        onCommentClick(task.id);
        setRightSidebarContent(<TaskCommentThread taskId={task.id} taskCode={typeof task.task_code === 'string' ? task.task_code : String(task.task_code || 'No Code')} />);
      }}
    >
      <TableCell className="w-[8%] px-4">
        <Badge variant="outline" className="font-mono text-xs">
          {task.task_code || '—'}
        </Badge>
      </TableCell>
      <TableCell className="w-[10%] px-4">
        <div className="flex flex-col items-start gap-1">
          <span 
            className="px-2 py-1 text-xs rounded-full font-semibold inline-block" 
            style={{
              backgroundColor: getStatusColor(task.status || {
                name: null,
                color_hex: null
              }, task.is_awaiting_input, task.is_onhold, task.priority_level_id).bg,
              color: getStatusColor(task.status || {
                name: null,
                color_hex: null
              }, task.is_awaiting_input, task.is_onhold, task.priority_level_id).text
            }}
          >
            {task.is_awaiting_input ? 'Awaiting Input' : 
             task.is_onhold && task.priority_level_id === 1 ? 'Urgent' :
             task.is_onhold ? 'Onhold' :
             task.priority_level_id === 1 ? 'Urgent' :
             task.status?.name}
          </span>
          {task.queue_position && (
            <span className="text-xs text-gray-500 pl-2">
              #{task.queue_position}
            </span>
          )}
          {task.completed_at && (
            <span className="text-xs text-gray-500 pl-2">
              {task.logged_duration ? formatInterval(task.logged_duration) : task.actual_duration ? formatInterval(task.actual_duration) : '0h'}
            </span>
          )}
          {task.status?.name === 'Open' && task.est_start && (
            <span className="text-xs text-gray-500 pl-2">
              {format(new Date(task.est_start), "h:mmaaa d MMM")}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="w-[30%] px-4">
        <div className="flex-1 min-w-0 max-w-[350px]">
          <p className="text-sm break-words">{task.details}</p>
          <p className="text-xs text-gray-500 mt-1">{task.task_type?.name}</p>
        </div>
      </TableCell>
      <TableCell className="w-[5%] px-4 text-center">
        <div className="flex gap-1 justify-center">
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
      <TableCell className="w-[7%] px-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{
              backgroundColor: getPriorityColor(task.priority)
            }} 
          />
          <span className="text-xs text-gray-700">
            {task.priority?.name || 'Not set'}
          </span>
        </div>
      </TableCell>
      <TableCell className="w-[7%] px-4 text-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex gap-0.5 justify-center">
                {[...Array(6)].map((_, index) => (
                  <div 
                    key={index} 
                    className={`w-1 h-4 rounded-sm ${index < getComplexityBars(task.complexity) ? 'bg-gray-600' : 'bg-gray-200'}`} 
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
      <TableCell className="w-[8%] px-4 text-left">
        {task.est_start ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-600">{format(new Date(task.est_start), "h:mm a")}</span>
            <span className="text-xs text-gray-700">{format(new Date(task.est_start), "MMM d")}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-700">Not set</span>
        )}
      </TableCell>
      
      <TableCell className="w-[8%] px-4 text-left">
        {task.est_end ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-600">{format(new Date(task.est_end), "h:mm a")}</span>
            <span className="text-xs text-gray-700">{format(new Date(task.est_end), "MMM d")}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-700">Not set</span>
        )}
      </TableCell>
      
      <TableCell className="w-[9%] px-4">
        <div className="flex flex-col gap-1">
          {task.reference_links && renderReferenceLinks(task.reference_links as Record<string, string>)}
        </div>
      </TableCell>

      <TableCell className="w-[8%] px-4 text-center">
        <div className="flex -space-x-2 justify-center">
          {task.images && Array.isArray(task.images) && task.images.length > 0 && 
            (task.images as string[]).map((image, index) => (
              <div 
                key={index} 
                className="w-8 h-8 relative cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(image, task.images as string[]);
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
          }
        </div>
      </TableCell>
    </TableRow>
  );

  // Function to get status color with styling
  const getStatusColor = (status: {
    name: string | null;
    color_hex: string | null;
  }, is_awaiting_input?: boolean, is_onhold?: boolean, priority_level_id?: number) => {
    // For awaiting input tasks, we use the awaiting input styling
    if (is_awaiting_input) {
      return {
        bg: '#FEF9C3',
        text: '#854D0E'
      };
    }
    
    // For on hold tasks, we use the on hold styling
    if (is_onhold) {
      return {
        bg: '#FDE68A',
        text: '#92400E'
      };
    }
    
    // For critical tasks (priority_level_id = 1), we use the urgent styling
    if (priority_level_id === 1) {
      return {
        bg: '#fff6ca',
        text: '#834a1e'
      };
    }
    
    if (!status?.color_hex) {
      return {
        bg: '#F3F4F6',
        text: '#374151'
      };
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

  const getComplexityBars = (complexity: {
    name: string;
    multiplier: number;
  } | null) => {
    if (!complexity) return 1;
    const complexityMap: {
      [key: string]: number;
    } = {
      'Basic': 1,
      'Standard': 2,
      'Advanced': 3,
      'Complex': 4,
      'Very Complex': 5,
      'Extreme': 6
    };
    return complexityMap[complexity.name] || 1;
  };

  const getPriorityColor = (priority: {
    name: string;
    color_hex: string;
  } | null) => {
    if (!priority) return '#9CA3AF';
    const priorityColors: {
      [key: string]: string;
    } = {
      'Very Low': '#6EE7B7',
      'Low': '#22C55E',
      'Normal': '#FBBF24',
      'Medium': '#F97316',
      'High': '#EF4444',
      'Critical': '#B91C1C'
    };
    return priorityColors[priority.name] || priority.color_hex || '#9CA3AF';
  };

  const renderReferenceLinks = (links: Record<string, string> | null) => {
    if (!links) return null;
    return Object.entries(links).map(([text, url], index) => <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-800 hover:text-gray-600">
        <Link2 className="w-3 h-3" />
        {String(text)}
      </a>);
  };

  const renderSectionHeader = (sectionName: string) => <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 px-[6px]">
      {getGroupLabel(sectionName)}
    </h3>;

  const RegularHeader = () => (
    <div className="bg-white border rounded-lg overflow-hidden mb-6">
      <Table>
        <TableHeader>
          <TableRow className="bg-white">
            <TableHead className="w-[8%] px-4">Task Code</TableHead>
            <TableHead className="w-[10%] px-4">Status</TableHead>
            <TableHead className="w-[30%] px-4">Details</TableHead>
            <TableHead className="w-[5%] px-4 text-center">Device</TableHead>
            <TableHead className="w-[7%] px-4">Priority</TableHead>
            <TableHead className="w-[7%] px-4 text-center">Level</TableHead>
            <TableHead className="w-[8%] px-4 text-left">Start Time</TableHead>
            <TableHead className="w-[8%] px-4 text-left">ETA</TableHead>
            <TableHead className="w-[9%] px-4">Links</TableHead>
            <TableHead className="w-[8%] px-4 text-center">Assets</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    </div>
  );

  const TaskSection = ({
    title,
    taskList
  }: {
    title: string;
    taskList: typeof tasks;
  }) => {
    if (taskList.length === 0) return null;
    return (
      <div className="mb-6">
        {renderSectionHeader(title)}
        <div className="bg-white border rounded-lg overflow-hidden">
          <Table>
            <TableBody>
              {taskList.map(task => renderTaskRow(task))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <>
      <RegularHeader />
      
      {groupedTasks.critical.length > 0 && <TaskSection title="critical" taskList={groupedTasks.critical} />}
      
      {groupedTasks.active.length > 0 && <TaskSection title="active" taskList={groupedTasks.active} />}
      
      {groupedTasks.scheduled.length > 0 && <TaskSection title="scheduled" taskList={groupedTasks.scheduled} />}
      
      {groupedTasks.completed.length > 0 && <TaskSection title="completed" taskList={groupedTasks.completed} />}
      
      {groupedTasks.special.length > 0 && <TaskSection title="special" taskList={groupedTasks.special} />}
    </>
  );
};

export default TasksTable;
