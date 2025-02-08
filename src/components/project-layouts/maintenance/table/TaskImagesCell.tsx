
import { TableCell } from "@/components/ui/table";
import { Maximize } from "lucide-react";

interface TaskImagesCellProps {
  images: string[] | null;
  onImageClick: (image: string, images: string[]) => void;
}

export const TaskImagesCell = ({ images, onImageClick }: TaskImagesCellProps) => {
  return (
    <TableCell>
      <div className="flex -space-x-2">
        {images && Array.isArray(images) && images.length > 0 && (
          images.map((image, index) => (
            <div
              key={index}
              className="w-8 h-8 relative cursor-pointer"
              onClick={() => onImageClick(image, images)}
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
  );
};
