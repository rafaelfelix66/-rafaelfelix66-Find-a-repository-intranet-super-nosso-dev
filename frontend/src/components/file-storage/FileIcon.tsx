//src/components/file-storage/Fileicon.tsx
import React from "react";
import { FileText, Folder, FileImage, FileSpreadsheet, FileCode, FileArchive } from "lucide-react";

interface FileIconProps {
  extension?: string;
  size?: number;
  type: 'file' | 'folder';
}

export const FileIcon: React.FC<FileIconProps> = ({ extension, size = 40, type }) => {
  if (type === 'folder') {
    return <Folder size={size} className="text-supernosso-purple" />;
  }
  
  // Determine icon and color based on file extension
  switch((extension || '').toLowerCase()) {
    case 'pdf':
      return <FileText size={size} className="text-red-500" />;
    case 'docx':
    case 'doc':
      return <FileText size={size} className="text-blue-500" />;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return <FileSpreadsheet size={size} className="text-green-500" />;
    case 'pptx':
    case 'ppt':
      return <FileText size={size} className="text-orange-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return <FileImage size={size} className="text-purple-500" />;
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return <FileArchive size={size} className="text-yellow-500" />;
    case 'js':
    case 'ts':
    case 'html':
    case 'css':
    case 'json':
    case 'php':
    case 'py':
      return <FileCode size={size} className="text-cyan-500" />;
    default:
      return <FileText size={size} className="text-gray-500" />;
  }
};