// src/components/file-storage/FileGrid.tsx - Versão com indicador RAG
import React, { useState, useMemo } from "react";
import { Download, MoreHorizontal, Trash, Pencil, ExternalLink, Eye, Bot, BotOff } from "lucide-react";
import { useFiles, FileItem } from "@/contexts/FileContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { RenameDialog } from "./RenameDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileIcon } from "./FileIcon";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const FileGrid = () => {
  const { 
    filteredFiles, 
    navigateToFolder, 
    downloadFile, 
    deleteItem, 
    isLoading, 
    error,
    openFilePreview,
    searchQuery,
    canUserAccessItem
  } = useFiles();
  
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
  
  // Debug log para verificar os arquivos recebidos
  React.useEffect(() => {
    console.log('DEBUG FileGrid - Arquivos filtrados:', filteredFiles);
    console.log('DEBUG FileGrid - Quantidade:', filteredFiles.length);
    filteredFiles.forEach((file, index) => {
      console.log(`DEBUG FileGrid - Arquivo ${index}:`, {
        id: file.id,
        name: file.name,
        type: file.type,
        allowRAG: file.allowRAG,
        hasAccess: canUserAccessItem(file)
      });
    });
  }, [filteredFiles, canUserAccessItem]);
  
  const itemsWithIcons = useMemo(() => {
    return filteredFiles.map(item => {
      // Garantir que o item tenha um ícone
      if (!item.icon) {
        if (item.type === 'folder') {
          item.icon = <FileIcon type="folder" />;
        } else if (item.type === 'link') {
          item.icon = <FileIcon type="link" />;
        } else {
          item.icon = <FileIcon type="file" extension={item.extension} />;
        }
      }
      return item;
    });
  }, [filteredFiles]);
  
  const handleItemClick = (file: FileItem) => {
    console.log('DEBUG - Clicando no item:', file.name, file.type);
    
    // Verificar acesso antes de permitir interação
    if (!canUserAccessItem(file)) {
      console.log('DEBUG - Acesso negado ao item:', file.name);
      return;
    }
    
    if (file.type === 'folder') {
      navigateToFolder(file);
    } else if (file.type === 'link' && file.linkUrl) {
      window.open(file.linkUrl, '_blank', 'noopener,noreferrer');
    } else if (file.type === 'file') {
      // Para arquivos, verificar se pode visualizar
      const canPreview = file.mimeType && (
        file.mimeType.startsWith('image/') ||
        file.mimeType === 'application/pdf' ||
        file.mimeType.startsWith('text/') ||
        file.mimeType.startsWith('video/') ||
        file.mimeType.startsWith('audio/')
      );
      
      if (canPreview) {
        openFilePreview(file);
      } else if (file.allowDownload) {
        // Se não pode visualizar mas pode baixar
        handleDownload(file, new MouseEvent('click'));
      } else {
        console.log('DEBUG - Arquivo não pode ser visualizado nem baixado:', file.name);
      }
    }
  };
  
  const handleDownload = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!canUserAccessItem(file)) {
      console.log('DEBUG - Acesso negado para download:', file.name);
      return;
    }
    
    if (!file.allowDownload) {
      console.log('DEBUG - Download não permitido para:', file.name);
      return;
    }
    
    const fileName = file.originalName || file.name;
    downloadFile(file.id, fileName);
  };
  
  const handlePreview = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!canUserAccessItem(file)) {
      console.log('DEBUG - Acesso negado para preview:', file.name);
      return;
    }
    
    openFilePreview(file);
  };
  
  const handleDelete = (id: string) => {
    deleteItem(id);
    setDeleteDialogOpen(false);
  };
  
  const openDeleteDialog = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(file);
    setDeleteDialogOpen(true);
  };
  
  const handleRename = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToRename(file);
    setRenameDialogOpen(true);
  };
  
  const getOwnerInitials = (owner: any): string => {
    if (!owner?.name && !owner?.nome) return 'UN';
    
    const name = owner.name || owner.nome;
    const initials = name.split(' ')
      .map((part: string) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
      
    return initials || 'UN';
  };
  
  // Verificar se pode visualizar o arquivo
  const canPreviewFile = (file: FileItem): boolean => {
    return file.type === 'file' && file.mimeType && (
      file.mimeType.startsWith('image/') ||
      file.mimeType === 'application/pdf' ||
      file.mimeType.startsWith('text/') ||
      file.mimeType.startsWith('video/') ||
      file.mimeType.startsWith('audio/')
    );
  };
  
  // Renderizar badges de status com indicador RAG
  const renderStatusBadges = (item: FileItem) => {
    const badges = [];
    
    // Badge de tipo
    if (item.type === 'link') {
      badges.push(
        <Badge key="link" variant="outline" className="text-green-600 border-green-200">
          Link
        </Badge>
      );
    }
    
    // NOVO: Badge de RAG
    if (item.allowRAG) {
      badges.push(
        <TooltipProvider key="rag-enabled">
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                <Bot className="h-3 w-3 mr-1" />
                IA
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Disponível para a assistente Gabi</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // Badge de download restrito
    if (item.type === 'file' && !item.allowDownload) {
      badges.push(
        <TooltipProvider key="no-download">
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-red-600 border-red-200">
                <BotOff className="h-3 w-3 mr-1" />
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
  
  if (isLoading) {
    return (
      <div className="space-y-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center p-3 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded mr-4" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg inline-block mb-4">
          <p className="font-medium">Erro ao carregar arquivos</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }
  
  console.log('DEBUG FileGrid - Renderizando', itemsWithIcons.length, 'itens');
  
  return (
    <>
      <div className="space-y-1">
        {itemsWithIcons.length > 0 ? (
          itemsWithIcons.map((file) => {
            const hasAccess = canUserAccessItem(file);
            console.log(`DEBUG FileGrid - Renderizando item ${file.name}, hasAccess: ${hasAccess}, allowRAG: ${file.allowRAG}`);
            
            return (
              <div 
                key={file.id} 
                className={`flex items-center p-3 rounded-md border border-transparent transition-all ${
                  hasAccess 
                    ? 'hover:bg-gray-50 hover:border-gray-200 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => hasAccess && handleItemClick(file)}
              >
                {/* Ícone ou imagem da pasta */}
                <div className="flex-shrink-0 mr-4">
                  {file.type === 'folder' && file.coverImage ? (
                    <div className="h-20 w-20 rounded-lg overflow-hidden shadow-sm border border-gray-200 relative">
                      <img 
                        src={file.coverImage} 
                        alt={`Capa de ${file.name}`}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          const parent = img.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="h-12 w-12 flex items-center justify-center text-blue-500"><svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg></div>';
                          }
                        }}
                      />
                      {/* Indicador RAG para pastas com capa */}
                      {file.allowRAG && (
                        <div className="absolute top-1 right-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="bg-blue-500 text-white rounded-full p-1">
                                  <Bot className="h-3 w-3" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Pasta habilitada para IA</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-12 w-12 flex items-center justify-center relative">
                      {file.icon}
                      {/* Indicador RAG para itens sem capa */}
                      {file.allowRAG && (
                        <div className="absolute -top-1 -right-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="bg-blue-500 text-white rounded-full p-0.5">
                                  <Bot className="h-2.5 w-2.5" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{file.type === 'folder' ? 'Pasta habilitada para IA' : 'Disponível para a assistente Gabi'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Informações do arquivo/pasta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                        {file.type === 'link' && (
                          <ExternalLink className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                        {!hasAccess && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                            Sem acesso
                          </span>
                        )}
                      </div>
                      
                      {/* Badges de status */}
                      <div className="flex flex-wrap gap-1 mb-1 mt-1">
                        {renderStatusBadges(file)}
                      </div>
                      
                      {file.description && (
                        <p className="text-sm text-gray-600 truncate mt-0.5">{file.description}</p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        {file.type === 'file' && file.size && (
                          <>
                            <span>{file.size}</span>
                            <span>•</span>
                          </>
                        )}
                        {file.type === 'link' && file.linkUrl && (
                          <>
                            <span className="truncate max-w-xs">{file.linkUrl}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{file.modified}</span>
                        
                        {/* Informações de acesso */}
                        {file.departamentoVisibilidade && 
                         !file.departamentoVisibilidade.includes('TODOS') && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600 text-xs">
                              Restrito: {file.departamentoVisibilidade.join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Badge do proprietário */}
                    {file.owner && (
                      <div className="ml-4 flex items-center">
                        <div 
                          className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 cursor-help"
                          title={`Proprietário: ${file.owner.name || file.owner.nome || 'Desconhecido'}`}
                        >
                          {getOwnerInitials(file.owner)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Menu de ações - apenas se tiver acesso */}
                {hasAccess && (
                  <div className="ml-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* Ações para links */}
                        {file.type === 'link' && file.linkUrl && (
                          <DropdownMenuItem onClick={() => window.open(file.linkUrl, '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Link
                          </DropdownMenuItem>
                        )}
                        
                        {/* Ações para arquivos */}
                        {file.type === 'file' && (
                          <>
                            {canPreviewFile(file) && (
                              <DropdownMenuItem onClick={(e) => handlePreview(file, e)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                            )}
                            
                            {file.allowDownload && (
                              <DropdownMenuItem onClick={(e) => handleDownload(file, e)}>
                                <Download className="h-4 w-4 mr-2" />
                                Baixar
                              </DropdownMenuItem>
                            )}
                            
                            {!file.allowDownload && (
                              <DropdownMenuItem disabled>
                                <Download className="h-4 w-4 mr-2 opacity-50" />
                                Download não permitido
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        {/* Indicador de status RAG no menu */}
                        <DropdownMenuItem disabled className="text-xs">
                          <Bot className={`h-4 w-4 mr-2 ${file.allowRAG ? 'text-blue-500' : 'text-gray-400'}`} />
                          {file.allowRAG ? 'Disponível para IA' : 'Não disponível para IA'}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {/* Ações gerais */}
                        <DropdownMenuItem onClick={(e) => handleRename(file, e)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Renomear
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          className="text-red-500" 
                          onClick={(e) => openDeleteDialog(file, e)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="h-12 w-12 text-gray-300 mx-auto mb-3">
              <span className="text-3xl">📁</span>
            </div>
            <h3 className="text-lg font-medium">Nenhum arquivo encontrado</h3>
            <p className="text-sm text-gray-500">
              {searchQuery 
                ? `Não encontramos resultados para "${searchQuery}"`
                : "Esta pasta está vazia. Comece enviando arquivos ou criando pastas."}
            </p>
          </div>
        )}
      </div>
      
      {/* Diálogo de renomeação */}
      {itemToRename && (
        <RenameDialog 
          item={itemToRename}
          isOpen={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
        />
      )}
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {itemToDelete?.type === 'folder' ? 'a pasta' : 'o arquivo'} "{itemToDelete?.name}"?
              {itemToDelete?.type === 'folder' && (
                <p className="mt-2 text-red-500 font-medium">
                  ⚠️ Atenção: Todos os arquivos e subpastas também serão excluídos permanentemente!
                </p>
              )}
              {itemToDelete?.allowRAG && (
                <p className="mt-2 text-blue-600 font-medium">
                  ℹ️ Este item está habilitado para IA e será removido da base de conhecimento da Gabi.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => itemToDelete && handleDelete(itemToDelete.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};