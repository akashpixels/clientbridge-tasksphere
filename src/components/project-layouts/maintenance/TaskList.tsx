
import React from 'react';
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Loader2, Eye } from "lucide-react";

interface TaskListProps {
  tasks: any[];
  isLoading: boolean;
  onTaskSelect: (taskId: string | null) => void;
  onImageSelect: (imageUrl: string | null) => void;
}

const TaskList = ({ tasks, isLoading, onTaskSelect, onImageSelect }: TaskListProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-500">No tasks found for this project.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="border-b text-left text-sm font-medium text-gray-500">
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Assigned To</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">{task.title}</td>
              <td className="px-4 py-3 text-sm">
                <span 
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" 
                  style={{ 
                    backgroundColor: task.task_status?.color_hex ? `${task.task_status.color_hex}20` : '#e5e7eb',
                    color: task.task_status?.color_hex || '#374151' 
                  }}
                >
                  {task.task_status?.name || 'Unknown'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                {task.assigned_to ? 
                  `${task.assigned_to.first_name} ${task.assigned_to.last_name}` : 
                  'Unassigned'}
              </td>
              <td className="px-4 py-3 text-sm">
                {new Date(task.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onTaskSelect(task.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                
                {/* Display attachment previews if available */}
                {task.task_attachments && task.task_attachments.length > 0 && (
                  <div className="flex mt-2 gap-1">
                    {task.task_attachments
                      .filter(att => att.file_type?.startsWith('image/'))
                      .slice(0, 3)
                      .map(attachment => (
                        <div 
                          key={attachment.id}
                          className="h-8 w-8 rounded overflow-hidden cursor-pointer"
                          onClick={() => onImageSelect(attachment.file_url)}
                        >
                          <img 
                            src={attachment.file_url} 
                            alt={attachment.file_name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskList;
