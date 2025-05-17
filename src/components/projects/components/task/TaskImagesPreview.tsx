
import React from 'react';
import { Maximize } from 'lucide-react';

interface TaskImagesPreviewProps {
  images: string[];
  onImageClick: (image: string, images: string[]) => void;
}

export const TaskImagesPreview: React.FC<TaskImagesPreviewProps> = ({ images, onImageClick }) => {
  if (!images || images.length === 0) {
    return null;
  }
  
  return (
    <div className="flex -space-x-2 justify-center">
      {images.map((image, index) => (
        <div 
          key={index} 
          className="w-8 h-8 relative cursor-pointer" 
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(image, images);
          }}
        >
          <img 
            src={image} 
            alt={`Task image ${index + 1}`} 
            className="w-8 h-8 rounded-lg border-2 border-white object-cover" 
          />
          <Maximize className="w-3 h-3 absolute top-0 right-0 text-gray-600 bg-white rounded-full p-0.5" />
        </div>
      ))}
    </div>
  );
};

export default TaskImagesPreview;
