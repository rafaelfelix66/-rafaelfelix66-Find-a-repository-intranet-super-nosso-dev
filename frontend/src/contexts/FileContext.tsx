//src/contexts/FileContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { fileService } from "@/services/fileService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  icon?: React.ReactNode; // Agora é opcional
  iconType?: string; // Novo campo
  size?: string;
  modified: string;
  path: string;
  parentId?: string | null;
  extension?: string;
}

interface FileContextType {
  files: FileItem[];
  currentPath: string[];
  currentParentId: string | null;
  searchQuery: string;
  filteredFiles: FileItem[];
  isLoading: boolean;
  error: string | null;
  setSearchQuery: (query: string) => void;
  navigateToFolder: (folder: FileItem) => void;
  navigateToBreadcrumb: (index: number) => void;
  createNewFolder: (name: string) => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  downloadFile: (fileId: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  renameItem: (id: string, newName: string) => void;
  refreshFiles: () => Promise<void>;
}

const FileContext = createContext<FileContextType | null>(null);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>(['Meus Arquivos']);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Carregar arquivos e pastas do backend
  const fetchFiles = async (folderId: string | null = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const items = await fileService.getFiles(folderId);
      setFiles(items);
    } catch (err) {
      console.error('Erro ao carregar arquivos:', err);
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar arquivos';
      setError(errorMsg);
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Inicialização - carregar arquivos da pasta raiz
  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles(currentParentId);
    }
  }, [isAuthenticated]);
  
  // Filtrar arquivos por consulta de pesquisa
  useEffect(() => {
    let filtered = files;
    
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredFiles(filtered);
  }, [files, searchQuery]);
  
  // Função para reconstruir o caminho da pasta
  const buildFolderPath = async (folderId: string | null): Promise<string[]> => {
    if (!folderId) return ['Meus Arquivos'];
    
    try {
      // Buscar todo o caminho recursivamente
      const folders: FileItem[] = [];
      let currentId: string | null = folderId;
      
      while (currentId) {
        const folderItems = await fileService.getFiles(currentId);
        const parentFolder = folderItems.find(f => f.id === currentId && f.type === 'folder');
        
        if (parentFolder) {
          folders.unshift(parentFolder);
          currentId = parentFolder.parentId;
        } else {
          currentId = null;
        }
      }
      
      return ['Meus Arquivos', ...folders.map(f => f.name)];
    } catch (error) {
      console.error('Erro ao obter caminho da pasta:', error);
      return ['Meus Arquivos'];
    }
  };
  
  // Navegar para uma pasta
  const navigateToFolder = async (folder: FileItem) => {
    if (folder.type !== 'folder') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Atualizar o ID da pasta atual
      setCurrentParentId(folder.id);
      
      // Buscar arquivos da nova pasta
      await fetchFiles(folder.id);
      
      // Atualizar caminho da navegação
      const newPath = await buildFolderPath(folder.id);
      setCurrentPath(newPath);
    } catch (error) {
      console.error('Erro ao navegar para a pasta:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao navegar para a pasta';
      setError(errorMsg);
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navegar pelo breadcrumb
  const navigateToBreadcrumb = async (index: number) => {
    if (index === 0) {
      // Voltar para a raiz
      setCurrentParentId(null);
      setCurrentPath(['Meus Arquivos']);
      fetchFiles(null);
      return;
    }
    
    // Encontrar o ID da pasta baseado no índice do breadcrumb
    try {
      const pathToFolder = currentPath.slice(0, index + 1);
      const folderName = pathToFolder[pathToFolder.length - 1];
      
      // Verificar o item anterior para obter a pasta pai
      const parentIndex = index - 1;
      const parentId = parentIndex === 0 ? null : currentParentId; // Simplificação
      
      // Buscar os itens da pasta pai
      const items = await fileService.getFiles(parentId);
      
      // Encontrar a pasta pelo nome
      const targetFolder = items.find(item => 
        item.type === 'folder' && item.name === folderName
      );
      
      if (targetFolder) {
        setCurrentParentId(targetFolder.id);
        setCurrentPath(pathToFolder);
        fetchFiles(targetFolder.id);
      }
    } catch (error) {
      console.error('Erro ao navegar no breadcrumb:', error);
      toast({
        title: "Erro",
        description: "Não foi possível navegar para esta pasta",
        variant: "destructive"
      });
    }
  };
  
  // Criar nova pasta
  const createNewFolder = async (name: string) => {
    if (!name.trim()) {
      toast({
        title: "Nome inválido",
        description: "O nome da pasta não pode estar vazio",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await fileService.createFolder(name, currentParentId);
      toast({
        title: "Pasta criada",
        description: `Pasta "${name}" criada com sucesso`
      });
      await fetchFiles(currentParentId);
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao criar pasta';
      setError(errorMsg);
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Upload de arquivo
  const uploadFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await fileService.uploadFile(file, currentParentId);
      toast({
        title: "Upload concluído",
        description: `Arquivo "${file.name}" enviado com sucesso`
      });
      await fetchFiles(currentParentId);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao fazer upload';
      setError(errorMsg);
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Download de arquivo
  const downloadFile = async (fileId: string) => {
    try {
      await fileService.downloadFile(fileId);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao baixar arquivo';
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive"
      });
    }
  };
  
  // Excluir item (arquivo ou pasta)
  const deleteItem = async (id: string) => {
    setIsLoading(true);
    
    try {
      // Encontrar o item para determinar o tipo
      const item = files.find(file => file.id === id);
      if (!item) {
        throw new Error('Item não encontrado');
      }
      
      // Excluir o item
      await fileService.deleteItem(id, item.type);
      
      toast({
        title: "Item excluído",
        description: `${item.type === 'folder' ? 'Pasta' : 'Arquivo'} "${item.name}" excluído com sucesso`
      });
      
      // Atualizar a lista de arquivos
      await fetchFiles(currentParentId);
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao excluir item';
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Renomear item (não implementado no backend, apenas UI)
  const renameItem = (id: string, newName: string) => {
    // Placeholder para futura implementação
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A função de renomear ainda não está disponível"
    });
  };
  
  // Atualizar lista de arquivos
  const refreshFiles = async () => {
    await fetchFiles(currentParentId);
  };
  
  return (
    <FileContext.Provider value={{
      files,
      currentPath,
      currentParentId,
      searchQuery,
      filteredFiles,
      isLoading,
      error,
      setSearchQuery,
      navigateToFolder,
      navigateToBreadcrumb,
      createNewFolder,
      uploadFile,
      downloadFile,
      deleteItem,
      renameItem,
      refreshFiles
    }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFiles must be used within a FileProvider");
  }
  return context;
};
