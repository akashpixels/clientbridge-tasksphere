
import React from 'react';
import { Link2 } from 'lucide-react';

interface TaskReferenceLinksProps {
  links: Record<string, string> | null;
}

export const TaskReferenceLinks: React.FC<TaskReferenceLinksProps> = ({ links }) => {
  if (!links) return null;
  
  return (
    <div className="flex flex-col gap-1">
      {Object.entries(links).map(([text, url], index) => (
        <a 
          key={index} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1 text-xs text-gray-800 hover:text-gray-600"
          onClick={(e) => e.stopPropagation()} // Prevent row click
        >
          <Link2 className="w-3 h-3" />
          {String(text)}
        </a>
      ))}
    </div>
  );
};

export default TaskReferenceLinks;
