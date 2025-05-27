//src/components/file-storage/FileGrid.tsx
import React, { useState, useMemo } from "react";
import { Clock, Download, MoreHorizontal, Trash, Pencil } from "lucide-react";
import { useFiles, FileItem } from "@/contexts/FileContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

export const FileGrid = () => {
  const { 
    filteredFiles, 
    navigateToFolder, 
    downloadFile, 
    deleteItem, 
    isLoading, 
    error,
    openFilePreview, // ADICIONADO
    searchQuery // ADICIONADO para corrigir o erro na linha 145
  } = useFiles();
  
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
  
  const itemsWithIcons = useMemo(() => {
    return filteredFiles.map(item => {
      if (!item.icon) {
        if (item.type === 'folder') {
          item.icon = <FileIcon type="folder" />;
        } else {
          item.icon = <FileIcon type="file" extension={item.extension} />;
        }
      }
      return item;
    });
  }, [filteredFiles]);
  
  const handleItemClick = (file: FileItem) => {
    console.log('Clicando no item:', file.name, file.type);
    
    if (file.type === 'folder') {
      navigateToFolder(file);
    } else if (file.type === 'link' && file.linkUrl) {
      window.open(file.linkUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Para arquivos, usar a função do contexto
      openFilePreview(file);
    }
  };
  
  const handleDownload = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const fileName = file.name;
    const extension = file.extension;
    const fullFileName = extension ? `${fileName}.${extension}` : fileName;
    
    downloadFile(file.id, fullFileName);
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
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-10 w-10 rounded-full mx-auto mb-2" />
            <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-3 w-1/2 mx-auto" />
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
  
  return (
    <>
      <div className="space-y-1">
      {itemsWithIcons.length > 0 ? (
        itemsWithIcons.map((file) => (
          <div 
            key={file.id} 
            className="flex items-center p-3 hover:bg-gray-50 rounded-md cursor-pointer border border-transparent hover:border-gray-200 transition-all"
            onClick={() => handleItemClick(file)}
          >
            {/* Ícone ou imagem da pasta */}
            <div className="flex-shrink-0 mr-4">
              {file.type === 'folder' && file.coverImage ? (
                <div className="h-12 w-12 rounded overflow-hidden">
                  <img 
                    src={file.coverImage} 
                    alt={`Capa de ${file.name}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Fallback para ícone se a imagem falhar
                      const img = e.target as HTMLImageElement;
                      const parent = img.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="h-12 w-12 flex items-center justify-center text-blue-500"><svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg></div>';
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-12 w-12 flex items-center justify-center">
                  {file.icon}
                </div>
              )}
            </div>
            
            {/* Informações do arquivo/pasta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  {file.description && (
                    <p className="text-sm text-gray-600 truncate">{file.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    {file.type === 'file' && file.size && (
                      <span>{file.size}</span>
                    )}
                    <span>•</span>
                    <span>{file.modified}</span>
                  </div>
                </div>
                
                {/* Badge do proprietário */}
                {file.owner && (
				  <div className="ml-4 flex items-center">
					<div 
					  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 cursor-help"
					  title={file.owner.name || file.owner.nome || 'Proprietário'}
					>
					  {getOwnerInitials(file.owner)}
					</div>
				  </div>
				)}
              </div>
            </div>
            
            {/* Menu de ações */}
            <div className="ml-4" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {file.type === 'file' && (
                    <DropdownMenuItem onClick={(e) => handleDownload(file, e)}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </DropdownMenuItem>
                  )}
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
          </div>
        ))
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
      
      {/* REMOVIDO o FileViewer daqui - será tratado pelo FileViewerWrapper */}
      
      {itemToRename && (
        <RenameDialog 
          item={itemToRename}
          isOpen={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
        />
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {itemToDelete?.type === 'folder' ? 'a pasta' : 'o arquivo'} "{itemToDelete?.name}"?
              {itemToDelete?.type === 'folder' && (
                <p className="mt-2 text-red-500">
                  Atenção: Todos os arquivos e subpastas também serão excluídos!
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