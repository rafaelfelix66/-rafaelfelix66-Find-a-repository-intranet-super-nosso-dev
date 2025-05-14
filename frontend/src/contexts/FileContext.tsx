// src/contexts/FileContext.tsx (Versão corrigida)
import React, { createContext, useContext, useState, useEffect } from "react";
import { fileService } from "@/services/fileService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";


export interface FileOwner {
  id: string;
  name: string;
}

export interface FileItem {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;  
  type: 'file' | 'folder';
  icon?: React.ReactNode; // Opcional - definido pelo componente
  iconType?: string;
  size?: string;
  modified: string;
  path: string;
  parentId?: string | null;
  extension?: string;
  mimeType?: string;  // Adicionado para suporte à visualização
  originalName?: string; // Adicionado para download correto
  owner?: FileOwner; // Adicionado para mostrar proprietário
}

// Interface para visualização de arquivos
export interface FilePreview {
  fileId: string;
  fileName: string;
  fileType: string;
  previewUrl: string;
  canPreview: boolean;
}

interface FileContextType {
  files: FileItem[];
  currentPath: string[];
  currentParentId: string | null;
  searchQuery: string;
  filteredFiles: FileItem[];
  isLoading: boolean;
  error: string | null;
  previewFile: FilePreview | null;
  setSearchQuery: (query: string) => void;
  navigateToFolder: (folder: FileItem) => void;
  navigateToBreadcrumb: (index: number) => void;
  createNewFolder: (name: string, description?: string, coverImage?: File | null) => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  downloadFile: (fileId: string) => Promise<void>;
  deleteItem: (id: string, type: 'file' | 'folder') => Promise<void>;
  openFilePreview: (file: FileItem) => void;
  closeFilePreview: () => void;
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
  const [previewFile, setPreviewFile] = useState<FilePreview | null>(null);
  
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Carregar arquivos e pastas do backend
  const fetchFiles = async (folderId: string | null = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Buscando arquivos da pasta ${folderId || 'raiz'}`);
      const items = await fileService.getFiles(folderId);
      console.log(`Encontrados ${items.length} itens`);
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
  
  // Função para abrir visualização de arquivo
  const openFilePreview = async (file: FileItem) => {
  try {
    // Verificar se o arquivo pode ser visualizado
    const canPreview = fileService.canPreviewFile(file.mimeType, file.extension);
    
    if (!canPreview) {
      setPreviewFile({
        fileId: file.id,
        fileName: file.name,
        fileType: file.mimeType || `file/${file.extension}`,
        previewUrl: '', // Vazio para arquivos que não podem ser visualizados
        canPreview: false
      });
      return;
    }
    
    // Obter token de autenticação
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    // Definir a URL base diretamente, sem depender de api.getBaseUrl()
    // Em produção, usamos a mesma origem (ou outra URL conforme necessário)
    let baseUrl = '/api';
    
    // Em desenvolvimento, conecta-se ao servidor de desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      baseUrl = 'http://localhost:3000/api';
    }
    
    // Preparar URL completa
    const url = `${baseUrl}/files/preview/${file.id}`;
    console.log(`Requisitando preview do arquivo: ${url}`);
    
    // Log detalhado para debug
    console.log(`Token presente: ${token ? 'Sim' : 'Não'}`);
    console.log(`Token (primeiros caracteres): ${token.substring(0, 10)}...`);
    
    // Fazer a requisição com o token nos cabeçalhos
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token // Incluir em ambos os formatos para compatibilidade
      }
    });
    
    // Log de debug para a resposta
    console.log(`Status da resposta: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na resposta: Status ${response.status}`);
      console.error(`Corpo da resposta: ${errorText}`);
      throw new Error(`Erro ao buscar preview: ${response.status} - ${errorText}`);
    }
    
    // Criar blob URL para o conteúdo
    const blob = await response.blob();
    const previewUrl = URL.createObjectURL(blob);
    
    // Definir o objeto de preview
    setPreviewFile({
      fileId: file.id,
      fileName: file.name,
      fileType: file.mimeType || `file/${file.extension}`,
      previewUrl,
      canPreview: true
    });
    
    console.log('Preview preparado com sucesso:', {
      fileName: file.name,
      fileType: file.mimeType
    });
  } catch (error) {
    console.error('Erro ao abrir visualização:', error);
    toast({
      title: "Erro ao visualizar arquivo",
      description: error instanceof Error ? error.message : "Não foi possível abrir a visualização",
      variant: "destructive"
    });
  }
};

// Função para fechar visualização de arquivo
const closeFilePreview = () => {
  // Limpar URL de objeto se existir
  if (previewFile?.previewUrl && previewFile.previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previewFile.previewUrl);
  }
  setPreviewFile(null);
};
  
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
      console.log(`Navegando para a pasta: ${folder.name} (ID: ${folder.id})`);
      
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
  const createNewFolder = async (name: string, description?: string, coverImage?: File | null) => {
  try {
    setIsLoading(true);
    
    // A função do serviço será criada no próximo arquivo
    await fileService.createFolder(name, description, currentParentId, coverImage);
    
    toast({
      title: "Pasta criada",
      description: `A pasta "${name}" foi criada com sucesso.`
    });
    
    // Atualizar a lista de arquivos
    await fetchFiles(currentParentId);
    setSearchQuery(''); // Limpa a busca ao criar nova pasta
  } catch (error) {
    console.error('Erro ao criar pasta:', error);
    toast({
      title: "Erro",
      description: "Não foi possível criar a pasta.",
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
      const file = files.find(f => f.id === fileId);
      await fileService.downloadFile(fileId, file?.originalName);
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
  const deleteItem = async (id: string, type: 'file' | 'folder') => {
    setIsLoading(true);
    
    try {
      // Encontrar o item para determinar o tipo
      const item = files.find(file => file.id === id);
      if (!item) {
        throw new Error('Item não encontrado');
      }
      
      // Excluir o item
      await fileService.deleteItem(id, type);
      
      toast({
        title: "Item excluído",
        description: `${type === 'folder' ? 'Pasta' : 'Arquivo'} "${item.name}" excluído com sucesso`
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
      previewFile,
      setSearchQuery,
      navigateToFolder,
      navigateToBreadcrumb,
      createNewFolder,
      uploadFile,
      downloadFile,
      deleteItem,
      openFilePreview,
      closeFilePreview,
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