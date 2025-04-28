// src/pages/FileStorage.tsx (Versão atualizada)
import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FilePlus, 
  FolderPlus, 
  Search, 
  RefreshCw, 
  ChevronRight, 
  Home,
  AlertCircle,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { FileProvider, useFiles } from "@/contexts/FileContext";
import { FileItemComponent } from "@/components/file-storage/FileItem";
import { FileViewer } from "@/components/file-storage/FileViewer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Componente de navegação por breadcrumb
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

// Componente de cabeçalho com ações
const FileHeader: React.FC = () => {
  const { setSearchQuery, refreshFiles } = useFiles();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { createNewFolder, uploadFile } = useFiles();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };
  
  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    
    setIsLoading(true);
    try {
      await createNewFolder(folderName);
      setFolderName("");
      setIsNewFolderDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    try {
      await uploadFile(selectedFile);
      setSelectedFile(null);
      setIsUploadDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h2 className="text-2xl font-bold">Arquivos</h2>
        <p className="text-muted-foreground">
          Gerencie e compartilhe seus arquivos com a equipe
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar arquivos..."
            className="pl-8 w-[200px] lg:w-[300px]"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => refreshFiles()}
          title="Atualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setIsNewFolderDialogOpen(true)}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Nova Pasta
        </Button>
        
        <Button
          onClick={() => setIsUploadDialogOpen(true)}
        >
          <FilePlus className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>
      
      {/* Diálogo para criar nova pasta */}
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>
              Digite o nome da nova pasta que deseja criar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="folder-name">Nome da pasta</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Digite o nome da pasta"
              className="mt-2"
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewFolderDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!folderName.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Pasta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para upload de arquivo */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Arquivo</DialogTitle>
            <DialogDescription>
              Selecione um arquivo para fazer upload na pasta atual.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="file-input">Arquivo</Label>
            <Input
              id="file-input"
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="mt-2"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-500">
                Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Fazer Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente de grade de arquivos
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

// Componente principal
const FileStorage: React.FC = () => {
  return (
    <Layout>
      <FileProvider>
        <div className="space-y-6">
          <FileHeader />
          
          <Card>
            <CardHeader className="pb-3">
              <FileBreadcrumb />
            </CardHeader>
            <CardContent>
              <FileGrid />
            </CardContent>
          </Card>
          
          {/* Componente de visualização de arquivo */}
          <FileViewerWrapper />
        </div>
      </FileProvider>
    </Layout>
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

export default FileStorage;