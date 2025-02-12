
import { ImagePreviewProps } from '../types';

const ImagePreview = ({ images, onImageClick }: ImagePreviewProps) => {
  return (
    <div className="flex items-center">
      {images.map((url, index) => (
        <div
          key={index}
          onClick={() => onImageClick(url)}
          className="relative w-12 h-12 cursor-pointer transition-transform hover:scale-105"
          style={{ marginLeft: index === 0 ? "0" : "-8px" }}
        >
          <img
            src={url}
            alt="Attachment"
            className="w-full h-full object-cover rounded-lg border"
          />
        </div>
      ))}
    </div>
  );
};

export default ImagePreview;
