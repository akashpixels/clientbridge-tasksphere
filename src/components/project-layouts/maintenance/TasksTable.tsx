import { Tables } from "@/integrations/supabase/types";
import { Monitor, Smartphone, ArrowUp, ArrowDown, Maximize } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const formatETA = (date: string) => {
    return format(new Date(date), "h.mmaaa do MMM");
  };

  const getStatusColor = (status: { name: string | null, color_hex: string | null }) => {
    if (!status?.color_hex) {
      return { bg: '#F3F4F6', text: '#374151' };
    }

    // Split the color_hex string into background and text colors
    const [bgColor, textColor] = status.color_hex.split(',').map(color => color.trim());
    
    // If both colors are provided, use them directly
    if (bgColor && textColor) {
      return {
        bg: bgColor,
        text: textColor
      };
    }
    
    // Fallback to the old logic if the format is not as expected
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

  return (
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
            onClick={() => onSort('priority_level_id')}
          >
            Priority
          </TableHead>
          <TableHead 
            className="cursor-pointer"
            onClick={() => onSort('complexity_level_id')}
          >
            Complexity
          </TableHead>
          <TableHead 
            className="cursor-pointer"
            onClick={() => onSort('eta')}
          >
            ETA
          </TableHead>
          <TableHead>Assets</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
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
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                  {task.target_device === 'Desktop' && <Monitor className="w-4 h-4 text-gray-500" />}
                  {task.target_device === 'Mobile' && <Smartphone className="w-4 h-4 text-gray-500" />}
                  {task.target_device === 'Both' && (
                    <>
                      <Monitor className="w-4 h-4 text-gray-500" />
                      <Smartphone className="w-4 h-4 text-gray-500" />
                    </>
                  )}
                </div>
                <div className="flex-1 min-w-0 max-w-[350px]">
                  <p className="text-sm break-words">{task.details}</p>
                  <p className="text-xs text-gray-500 mt-1">{task.task_type?.name}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-xs" style={{ color: task.priority?.color }}>
                {task.priority?.name}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-xs text-gray-600">
                {task.complexity?.name}
              </span>
            </TableCell>

            
  {/* ETA Column */}
<TableCell className="text-left">
  {task.eta ? (
    <div className="flex flex-col">
      <span className="text-xs text-gray-600">{format(new Date(task.eta), "h.mmaaa")}</span>
      <span className="text-xs text-gray-700">{format(new Date(task.eta), "do MMM")}</span>
    </div>
  ) : (
    <span className="text-xs text-gray-700">Not set</span>
  )}
</TableCell>


            
            <TableCell>
              <div className="flex gap-2">
                {task.images && Array.isArray(task.images) && task.images.length > 0 && (
                  <div className="flex -space-x-2">
                    {task.images.map((image, index) => (
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
                    ))}
                  </div>
                )}
                {task.reference_links && Array.isArray(task.reference_links) && task.reference_links.length > 0 && (
                  <div className="flex items-center">
                    <span className="text-xs text-blue-600">
                      {task.reference_links.length} link{task.reference_links.length > 1 ? 's' : ''}
                    </span>
                  </div>
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
