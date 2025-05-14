import React from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Folder,
  File as FileIcon,
  Image,
  FileText,
  FileType,
  FileCode,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  FileArchive,
  FilePieChart,
  MoreVertical,
  Download,
  Trash2,
  Share2,
  Copy,
  Eye,
  ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FileItem as FileItemType } from "@/contexts/FileContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fileService } from "@/services/fileService";

interface FileItemProps {
  item: FileItemType;
  onItemClick: (item: FileItemType) => void;
  onItemDownload?: (item: FileItemType) => void;
  onItemDelete?: (item: FileItemType) => void;
  onItemPreview?: (item: FileItemType) => void;
}

export const FileItemComponent: React.FC<FileItemProps> = ({
  item,
  onItemClick,
  onItemDownload,
  onItemDelete,
  onItemPreview
}) => {
  // Função para verificar se o arquivo pode ser visualizado
  const canPreview = (): boolean => {
    return item.type === 'file' && 
      !!item.mimeType && 
      fileService.canPreviewFile(item.mimeType, item.extension);
  };
  
  // Função para renderizar o ícone adequado com base no tipo
  const renderIcon = () => {
    if (item.type === 'folder') {
      // Se a pasta tem capa, exibir a imagem
      if (item.coverImage) {
        return (
          <div className="h-16 w-16 rounded overflow-hidden relative group">
            <img 
              src={item.coverImage} 
              alt={`Capa de ${item.name}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback para ícone se a imagem falhar
                const img = e.target as HTMLImageElement;
                const parent = img.parentElement;
                if (parent) {
                  parent.innerHTML = '<svg class="h-10 w-10 text-blue-500"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>';
                }
              }}
            />
            {/* Overlay com ícone de pasta no hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Folder className="h-5 w-5 text-white" />
            </div>
          </div>
        );
      }
      return <Folder className="h-10 w-10 text-blue-500" />;
    }
    
    // Baseado no iconType ou extensão
    const iconType = item.iconType || 'file';
    const extension = item.extension?.toLowerCase() || '';
    
    switch (iconType) {
      case 'image':
        return <Image className="h-10 w-10 text-purple-500" />;
      case 'document':
        return <FileText className="h-10 w-10 text-blue-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="h-10 w-10 text-green-500" />;
      case 'presentation':
        return <FilePieChart className="h-10 w-10 text-orange-500" />;
      case 'video':
        return <FileVideo className="h-10 w-10 text-red-500" />;
      case 'audio':
        return <FileAudio className="h-10 w-10 text-pink-500" />;
      case 'archive':
        return <FileArchive className="h-10 w-10 text-yellow-500" />;
      case 'code':
        return <FileCode className="h-10 w-10 text-gray-500" />;
      default:
        // Baseado na extensão
        if (extension === 'pdf') {
          return <FileType className="h-10 w-10 text-red-500" />;
        }
        
        return <FileIcon className="h-10 w-10 text-gray-500" />;
    }
  };
  
  // Função para lidar com o clique no item
  const handleItemClick = () => {
    if (item.type === 'folder') {
      onItemClick(item);
    } else if (canPreview() && onItemPreview) {
      onItemPreview(item);
    } else if (onItemDownload) {
      onItemDownload(item);
    }
  };
  
  // Renderizar iniciais para o proprietário
  const getOwnerInitials = (): string => {
    if (!item.owner) return 'UN';
    
    const name = item.owner.name;
    if (!name) return 'UN';
    
    const initials = name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
      
    return initials || 'UN';
  };
  
  return (
    <div 
      className="flex items-center p-3 hover:bg-gray-50 rounded-md cursor-pointer border border-transparent hover:border-gray-200 transition-all"
      onClick={handleItemClick}
    >
      <div className="flex-shrink-0 mr-4">
        {renderIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium text-gray-900 truncate">{item.name}</p>
            {/* Adicionar descrição da pasta se existir */}
            {item.type === 'folder' && item.description && (
              <p className="text-sm text-gray-600 truncate mt-0.5">
                {item.description}
              </p>
            )}
            <p className="text-sm text-gray-500">
              {item.type === 'file' && item.size ? `${item.size} • ` : ''}
              {item.modified}
            </p>
          </div>
          
          <div className="ml-4 flex items-center gap-2">
            {/* Indicador visual de pasta com capa */}
            {item.type === 'folder' && item.coverImage && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <ImageIcon className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pasta com capa personalizada</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* Avatar do proprietário */}
            {item.owner && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-gray-200 text-xs">
                        {getOwnerInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Proprietário: {item.owner.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
      
      {/* Menu de ações */}
      <div 
        className="ml-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.type === 'file' && canPreview() && onItemPreview && (
              <DropdownMenuItem onClick={() => onItemPreview(item)}>
                <Eye className="mr-2 h-4 w-4" />
                <span>Visualizar</span>
              </DropdownMenuItem>
            )}
            
            {item.type === 'file' && onItemDownload && (
              <DropdownMenuItem onClick={() => onItemDownload(item)}>
                <Download className="mr-2 h-4 w-4" />
                <span>Baixar</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem>
              <Share2 className="mr-2 h-4 w-4" />
              <span>Compartilhar</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              <span>Copiar link</span>
            </DropdownMenuItem>
            
            {onItemDelete && (
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={() => onItemDelete(item)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Excluir</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};