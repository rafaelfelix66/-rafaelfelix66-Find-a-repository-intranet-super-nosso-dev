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
import { FileViewer } from "./FileViewer";
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
    error 
  } = useFiles();
  
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
    // Adicione ícones aos itens antes de renderizá-los
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
    if (file.type === 'folder') {
      navigateToFolder(file);
    } else {
      setSelectedFile(file);
      setFileViewerOpen(true);
    }
  };
  
  const handleDownload = (file: FileItem, e: React.MouseEvent) => {
  e.stopPropagation();
  // Construir o nome completo do arquivo
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
  
  // Renderiza esqueletos de carregamento
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
  
  // Renderiza mensagem de erro
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {itemsWithIcons.length > 0 ? (
          itemsWithIcons.map((file) => (
            <div 
              key={file.id} 
              className="border relative rounded-lg p-4 hover:border-supernosso-red/70 hover:shadow-sm transition-all cursor-pointer hover-lift"
              onClick={() => handleItemClick(file)}
            >
              <div className="flex flex-col items-center">
                {file.icon}
                <div className="mt-2 text-center">
                  <p className="font-medium line-clamp-1">{file.name}</p>
                  <p className="text-xs text-gray-500 flex items-center justify-center mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {file.modified}
                    {file.size && <span className="ml-2">({file.size})</span>}
                  </p>
                </div>
              </div>
              
              <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
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
          <div className="col-span-full text-center py-12">
            <div className="h-12 w-12 text-gray-300 mx-auto mb-3">
              {/* Placeholder para o ícone */}
              {itemsWithIcons.length === 0 && <span className="text-3xl">📁</span>}
            </div>
            <h3 className="text-lg font-medium">Nenhum arquivo encontrado</h3>
            <p className="text-sm text-gray-500">
              {useFiles().searchQuery 
                ? `Não encontramos resultados para "${useFiles().searchQuery}"`
                : "Esta pasta está vazia. Comece enviando arquivos ou criando pastas."}
            </p>
          </div>
        )}
      </div>
      
      {selectedFile && (
	  <FileViewer 
		 file={selectedFile} 
		 isOpen={fileViewerOpen} 
		 onOpenChange={setFileViewerOpen}
		 onDownload={() => {
		  // Construir o nome completo do arquivo
		  const fileName = selectedFile.name;
		  const extension = selectedFile.extension;
		  const fullFileName = extension ? `${fileName}.${extension}` : fileName;
		  
		  downloadFile(selectedFile.id, fullFileName);
		}}
	  />
)}
      
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