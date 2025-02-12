
import { ReactNode } from 'react';
import { FileText, File } from "lucide-react";

export const getFileIcon = (url: string): ReactNode => {
  const fileExtension = url.split('.').pop()?.toLowerCase();
  switch (fileExtension) {
    case 'pdf':
      return <FileText className="h-6 w-6 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="h-6 w-6 text-blue-500" />;
    case 'xls':
    case 'xlsx':
      return <FileText className="h-6 w-6 text-green-500" />;
    default:
      return <File className="h-6 w-6 text-gray-500" />;
  }
};

export const getFileName = (url: string) => {
  const fileName = decodeURIComponent(url.split('/').pop() || '');
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.')) || fileName;
  return nameWithoutExt.length <= 20 ? nameWithoutExt : `${nameWithoutExt.slice(0, 20)}...`;
};

export const isImageFile = (url: string) => {
  const fileExtension = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
};

export const handleDownload = async (url: string) => {
  if (!url) return;

  if (isImageFile(url)) {
    try {
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = url.split('/').pop() || 'downloaded-image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download image:", error);
      window.open(url, '_blank');
    }
  } else {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', url.split('/').pop() || 'file');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
