import { Tables } from "@/integrations/supabase/types";
import { Monitor, Smartphone, ArrowUp, ArrowDown, Maximize, Link2, MessageSquare } from "lucide-react";
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
import { useState } from "react";
import CommentsSidebar from "./comments/CommentsSidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

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
  })[];
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc';
  };
  onSort: (key: string) => void;
  onImageClick: (image: string, images: string[]) => void;
}

const TasksTable = ({ tasks, sortConfig, onSort, onImageClick }: TasksTableProps) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: commentCounts } = useQuery({
    queryKey: ['comment-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('task_id, id')
        .in('task_id', tasks.map(task => task.id));

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach(comment => {
        counts[comment.task_id] = (counts[comment.task_id] || 0) + 1;
      });

      return counts;
    },
  });

  const formatETA = (date: string) => {
    return format(new Date(date), "h.mmaaa do MMM");
  };

  const getStatusColor = (status: { name: string | null, color_hex: string | null }) => {
    if (!status?.color_hex) {
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
    if (!priority) return '#9CA3AF'; // Default gray color if priority is missing

    const priorityColors: { [key: string]: string } = {
      'Very Low': '#6EE7B7',  // Light Green
      'Low': '#22C55E',       // Green
      'Normal': '#FBBF24',    // Yellow/Orange
      'Medium': '#F97316',    // Orange
      'High': '#EF4444',      // Red
      'Critical': '#B91C1C'   // Dark Red
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
              onClick={() => onSort('eta')}
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
              onClick={() => setSelectedTaskId(task.id)}
            >
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <span 
                    className="px-2 py-1 text-xs rounded-full font-semibold"
                    style={{
                      backgroundColor: getStatusColor(task.status || { name: null, color_hex: null }).bg,
                      color: getStatusColor(task.status || { name: null, color_hex: null }).text
                    }}
                  >
                    {task.status?.name}
                  </span>
                  {task.task_completed_at && task.actual_hours_spent && (
                    <span className="text-xs text-gray-500 pl-2">
                      {task.actual_hours_spent} hrs
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
                  {/* Colored Dot */}
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  />
                  {/* Priority Text */}
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
                        onClick={() => onImageClick(image as string, task.images as string[])}
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

      {selectedTaskId && (
        <CommentsSidebar
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </>
  );
};

export default TasksTable;
