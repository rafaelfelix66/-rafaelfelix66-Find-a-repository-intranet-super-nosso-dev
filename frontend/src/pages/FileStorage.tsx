// src/pages/FileStorage.tsx (Versão corrigida com componentes modulares)
import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileProvider, useFiles } from "@/contexts/FileContext";
import { FileHeader } from "@/components/file-storage/FileHeader";
import { FileItemComponent } from "@/components/file-storage/FileItem";
import { FileViewer } from "@/components/file-storage/FileViewer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ChevronRight, 
  Home,
  AlertCircle,
  Loader2,
  CornerUpLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";

// Mantenha o FileBreadcrumb como está (ou mova para arquivo separado)
const FileBreadcrumb: React.FC = () => {
  const { currentPath, navigateToBreadcrumb } = useFiles();
  
  return (
    <div className="flex items-center text-sm text-gray-500 overflow-x-auto pb-2">
      {currentPath.map((path, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />}
          <button
            className={`hover:text-gray-900 whitespace-nowrap ${
              index === currentPath.length - 1 ? "font-medium text-gray-900" : ""
            }`}
            onClick={() => navigateToBreadcrumb(index)}
          >
            {index === 0 ? (
              <div className="flex items-center">
                <Home className="h-4 w-4 mr-1" />
                <span>{path}</span>
				<CornerUpLeft className="h-4 w-4 ml-1" />
              </div>
            ) : (
              path
            )}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

// Mantenha o FileGrid como está (ou mova para arquivo separado)
const FileGrid: React.FC = () => {
  const { 
    filteredFiles, 
    isLoading, 
    error, 
    navigateToFolder, 
    downloadFile, 
    deleteItem,
    openFilePreview,
    refreshFiles
  } = useFiles();
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'file' | 'folder'; name: string } | null>(null);
  
  const handleDelete = (item: any) => {
    setItemToDelete({
      id: item.id,
      type: item.type,
      name: item.name
    });
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      await deleteItem(itemToDelete.id, itemToDelete.type);
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshFiles()}
            className="ml-2"
          >
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (filteredFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
          <AlertCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-medium">Nenhum arquivo encontrado</h3>
        <p className="mt-2 text-sm text-gray-500">
          Esta pasta está vazia ou nenhum arquivo corresponde à sua pesquisa.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      {filteredFiles.map((item) => (
        <FileItemComponent
          key={item.id}
          item={item}
          onItemClick={navigateToFolder}
          onItemDownload={(item) => downloadFile(item.id)}
          onItemDelete={handleDelete}
          onItemPreview={openFilePreview}
        />
      ))}
      
      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-medium">
                {itemToDelete?.type === "folder" ? "a pasta" : "o arquivo"}{" "}
                "{itemToDelete?.name}"
              </span>
              ?
              {itemToDelete?.type === "folder" && (
                <p className="mt-2 text-red-500">
                  Essa ação também excluirá todos os arquivos e subpastas contidos nesta pasta.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Wrapper para o componente de visualização de arquivo
const FileViewerWrapper: React.FC = () => {
  const { previewFile, closeFilePreview, downloadFile } = useFiles();
  
  return (
    <FileViewer 
      filePreview={previewFile} 
      onClose={closeFilePreview} 
      onDownload={downloadFile} 
    />
  );
};

// Componente principal - VERSÃO CORRIGIDA
const FileStorage: React.FC = () => {
  return (
    <Layout>
      <FileProvider>
        <div className="space-y-6">
          <FileHeader />  {/* Usando o FileHeader modular que importa NewFolderDialog */}
          
          <Card>
            <CardHeader className="pb-3">
              <FileBreadcrumb />
            </CardHeader>
            <CardContent>
              <FileGrid />
            </CardContent>
          </Card>
          
          <FileViewerWrapper />
        </div>
      </FileProvider>
    </Layout>
  );
};

export default FileStorage;