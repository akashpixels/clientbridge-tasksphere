
import React from 'react';
import { TableCell } from "@/components/ui/table";
import { Monitor, Smartphone } from "lucide-react";

interface TaskDeviceCellProps {
  device: string;
}

export const TaskDeviceCell = ({ device }: TaskDeviceCellProps) => {
  return (
    <TableCell>
      <div className="flex gap-1">
        {device === 'Desktop' && <Monitor className="w-4 h-4 text-gray-500" />}
        {device === 'Mobile' && <Smartphone className="w-4 h-4 text-gray-500" />}
        {device === 'Both' && (
          <>
            <Monitor className="w-4 h-4 text-gray-500" />
            <Smartphone className="w-4 h-4 text-gray-500" />
          </>
        )}
      </div>
    </TableCell>
  );
};
