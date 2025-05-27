//src/components/file-storage/Fileicon.tsx
import React from "react";
import { 
  FileText, 
  Folder, 
  FileImage, 
  FileSpreadsheet, 
  FileCode, 
  FileArchive,
  FileVideo,     // ADICIONAR
  FileAudio,     // ADICIONAR
  FilePdf,       // Se disponível, ou manter FileText para PDF
  FilePresentation, // Se disponível, ou manter FileText para PPT
  Link  
} from "lucide-react";

interface FileIconProps {
  extension?: string;
  size?: number;
  type: 'file' | 'folder';
}

export const FileIcon: React.FC<FileIconProps> = ({ extension, size = 40, type }) => {
  if (type === 'folder') {
    return <Folder size={size} className="text-supernosso-purple" />;
  }
  if (type === 'link') {
    return <Link size={size} className="text-yellow-500" />;
  }
  
  
  // Determine icon and color based on file extension
switch((extension || '').toLowerCase()) {
  // PDFs
  case 'pdf':
    return <FileText size={size} className="text-red-600" />;
  
  // Documentos Word
  case 'docx':
  case 'doc':
    return <FileText size={size} className="text-blue-600" />;
  
  // Planilhas
  case 'xlsx':
  case 'xls':
  case 'csv':
    return <FileSpreadsheet size={size} className="text-green-600" />;
  
  // Apresentações
  case 'pptx':
  case 'ppt':
    return <FileText size={size} className="text-orange-600" />;
  
  // Imagens
  case 'jpg':
  case 'jpeg':
  case 'png':
  case 'gif':
  case 'bmp':
  case 'svg':
  case 'webp':
    return <FileImage size={size} className="text-purple-600" />;
  
  // Vídeos
  case 'mp4':
  case 'avi':
  case 'mov':
  case 'wmv':
  case 'flv':
  case 'webm':
  case 'mkv':
    return <FileVideo size={size} className="text-red-500" />; // Usar um ícone de vídeo se disponível
  
  // Áudios
  case 'mp3':
  case 'wav':
  case 'flac':
  case 'aac':
  case 'ogg':
    return <FileAudio size={size} className="text-pink-500" />; // Usar um ícone de áudio se disponível
  
  // Arquivos compactados
  case 'zip':
  case 'rar':
  case '7z':
  case 'tar':
  case 'gz':
    return <FileArchive size={size} className="text-yellow-600" />;
  
  // Código fonte
  case 'js':
  case 'jsx':
  case 'ts':
  case 'tsx':
  case 'html':
  case 'css':
  case 'json':
  case 'xml':
  case 'php':
  case 'py':
  case 'java':
  case 'c':
  case 'cpp':
    return <FileCode size={size} className="text-cyan-600" />;
  
  // Texto simples
  case 'txt':
  case 'rtf':
  case 'md':
    return <FileText size={size} className="text-gray-600" />;
  
  // Padrão
  default:
    return <FileText size={size} className="text-gray-500" />;
}
};