
import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';

interface TaskDeviceIconProps {
  targetDevice: 'desktop' | 'mobile' | 'both' | string;
}

export const TaskDeviceIcon: React.FC<TaskDeviceIconProps> = ({ targetDevice }) => {
  return (
    <div className="flex gap-1 justify-center">
      {targetDevice === 'desktop' && <Monitor className="w-4 h-4 text-gray-500" />}
      {targetDevice === 'mobile' && <Smartphone className="w-4 h-4 text-gray-500" />}
      {targetDevice === 'both' && (
        <>
          <Monitor className="w-4 h-4 text-gray-500" />
          <Smartphone className="w-4 h-4 text-gray-500" />
        </>
      )}
    </div>
  );
};

export default TaskDeviceIcon;
