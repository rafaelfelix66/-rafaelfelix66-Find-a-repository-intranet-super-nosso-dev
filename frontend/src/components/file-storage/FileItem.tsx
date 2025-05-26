// src/components/file-storage/FileItem.tsx - Versão melhorada
import React from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ImageIcon,
  Link,
  ExternalLink,
  Shield,
  ShieldOff,
  Users
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
  onItemShare?: (item: FileItemType) => void;
}

export const FileItemComponent: React.FC<FileItemProps> = ({
  item,
  onItemClick,
  onItemDownload,
  onItemDelete,
  onItemPreview,
  onItemShare
}) => {
  // Função para verificar se o arquivo pode ser visualizado
  const canPreview = (): boolean => {
    return item.type === 'file' && 
      !!item.mimeType && 
      fileService.canPreviewFile(item.mimeType, item.extension);
  };
  
  // Função para abrir link em nova aba
  const handleLinkClick = () => {
    if (item.type === 'link' && item.linkUrl) {
      window.open(item.linkUrl, '_blank', 'noopener,noreferrer');
    }
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
                  parent.innerHTML = '<div class="h-full w-full flex items-center justify-center"><svg class="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg></div>';
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
    
    // Para links
    if (item.type === 'link') {
      return <Link className="h-10 w-10 text-green-500" />;
    }
    
    // Para arquivos - baseado no iconType ou extensão
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
    } else if (item.type === 'link') {
      handleLinkClick();
    } else if (canPreview() && onItemPreview) {
      onItemPreview(item);
    } else if (onItemDownload && item.allowDownload) {
      onItemDownload(item);
    }
  };
  
  // Renderizar iniciais para o proprietário
  const getOwnerInitials = (): string => {
    if (!item.owner) return 'UN';
    
    const name = item.owner.name || item.owner.nome;
    if (!name) return 'UN';
    
    const initials = name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
      
    return initials || 'UN';
  };
  
  // Função para copiar link para área de transferência
  const handleCopyLink = async () => {
    if (item.type === 'link' && item.linkUrl) {
      try {
        await navigator.clipboard.writeText(item.linkUrl);
        // Aqui você poderia adicionar um toast de sucesso
      } catch (err) {
        console.error('Erro ao copiar link:', err);
      }
    }
  };
  
  // Renderizar badges de status
  const renderStatusBadges = () => {
    const badges = [];
    
    // Badge de tipo
    if (item.type === 'link') {
      badges.push(
        <Badge key="link" variant="outline" className="text-green-600 border-green-200">
          Link
        </Badge>
      );
    }
    
    // Badge de download restrito
    if (item.type === 'file' && !item.allowDownload) {
      badges.push(
        <TooltipProvider key="no-download">
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-red-600 border-red-200">
                <ShieldOff className="h-3 w-3 mr-1" />
                Sem Download
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download não permitido</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // Badge de visibilidade restrita
    if (item.departamentoVisibilidade && 
        !item.departamentoVisibilidade.includes('TODOS') && 
        item.departamentoVisibilidade.length > 0) {
      badges.push(
        <TooltipProvider key="restricted">
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                <Users className="h-3 w-3 mr-1" />
                Restrito
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visível apenas para: {item.departamentoVisibilidade.join(', ')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return badges;
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
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-gray-900 truncate">{item.name}</p>
              {item.type === 'link' && (
                <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
            </div>
            
            {/* Badges de status */}
            <div className="flex flex-wrap gap-1 mb-1">
              {renderStatusBadges()}
            </div>
            
            {/* Descrição */}
            {item.description && (
              <p className="text-sm text-gray-600 truncate mt-0.5 max-w-md">
                {item.description}
              </p>
            )}
            
            {/* Informações adicionais */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              {item.type === 'file' && item.size && (
                <span>{item.size}</span>
              )}
              {item.type === 'link' && item.linkUrl && (
                <span className="truncate max-w-xs">{item.linkUrl}</span>
              )}
              <span>•</span>
              <span>{item.modified}</span>
            </div>
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
                      <AvatarImage src={item.owner.avatar} alt={item.owner.name || item.owner.nome} />
                      <AvatarFallback className="bg-gray-200 text-xs">
                        {getOwnerInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Proprietário: {item.owner.name || item.owner.nome}</p>
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
            {/* Ações para links */}
            {item.type === 'link' && (
              <>
                <DropdownMenuItem onClick={handleLinkClick}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>Abrir Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copiar URL</span>
                </DropdownMenuItem>
              </>
            )}
            
            {/* Ações para arquivos */}
            {item.type === 'file' && (
              <>
                {canPreview() && onItemPreview && (
                  <DropdownMenuItem onClick={() => onItemPreview(item)}>
                    <Eye className="mr-2 h-4 w-4" />
                    <span>Visualizar</span>
                  </DropdownMenuItem>
                )}
                
                {item.allowDownload && onItemDownload && (
                  <DropdownMenuItem onClick={() => onItemDownload(item)}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Baixar</span>
                  </DropdownMenuItem>
                )}
                
                {!item.allowDownload && (
                  <DropdownMenuItem disabled>
                    <ShieldOff className="mr-2 h-4 w-4" />
                    <span>Download não permitido</span>
                  </DropdownMenuItem>
                )}
              </>
            )}
            
            <DropdownMenuSeparator />
            
            {/* Ações comuns */}
            {onItemShare && (
              <DropdownMenuItem onClick={() => onItemShare(item)}>
                <Share2 className="mr-2 h-4 w-4" />
                <span>Compartilhar</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              <span>Copiar link de acesso</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
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