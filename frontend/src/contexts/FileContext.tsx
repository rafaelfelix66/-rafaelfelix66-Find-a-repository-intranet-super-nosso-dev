// src/contexts/FileContext.tsx - Versão com Correções de Autenticação
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface FileOwner {
  id: string;
  name?: string;
  nome?: string;
  avatar?: string;
  departamento?: string;
}

export interface FileItem {
  id: string;
  name: string;
  description?: string;
  type: 'file' | 'folder' | 'link';
  icon?: React.ReactNode;
  iconType?: string;
  size?: string;
  modified: string;
  path?: string;
  // Para pastas
  parentId?: string | null;
  coverImage?: string;
  // Para arquivos
  folderId?: string | null;
  extension?: string;
  mimeType?: string;
  originalName?: string;
  // Para links
  linkUrl?: string;
  allowDownload?: boolean;
  allowRAG?: boolean;
  // Campos para departamentos
  departamentoVisibilidade?: string[];
  isRestrito?: boolean;
  isPublic?: boolean;
  owner?: FileOwner;
}

export interface FilePreview {
  fileId: string;
  fileName: string;
  fileType: string;
  previewUrl: string;
  canPreview: boolean;
}

export interface UploadOptions {
  description?: string;
  departamentoVisibilidade?: string[];
  allowDownload?: boolean;
  allowRAG?: boolean;
  type?: 'file' | 'link';
  linkName?: string;
  linkUrl?: string;
}

export interface FolderOptions {
  departamentoVisibilidade?: string[];
  allowRAG?: boolean;
}

export interface DepartmentFilter {
  value: string;
  label: string;
  count: number;
}

interface FileContextType {
  files: FileItem[];
  currentPath: string[];
  currentParentId: string | null;
  currentFolderId: string | null;
  searchQuery: string;
  filteredFiles: FileItem[];
  isLoading: boolean;
  error: string | null;
  previewFile: FilePreview | null;
  getCurrentFolder: () => FileItem | null;
  
  departmentFilter: string;
  availableDepartments: DepartmentFilter[];
  userDepartment: string | null;
  
  setSearchQuery: (query: string) => void;
  setDepartmentFilter: (department: string) => void;
  refreshFiles: () => Promise<void>;
  
  navigateToFolder: (folder: FileItem) => void;
  navigateToBreadcrumb: (index: number) => void;
  
  uploadFile: (file: File | null, options?: UploadOptions) => Promise<void>;
  createNewFolder: (name: string, description?: string, coverImage?: File | null, options?: FolderOptions) => Promise<void>;
  downloadFile: (fileId: string, fileName?: string) => Promise<void>;
  deleteItem: (itemId: string, itemType?: string) => Promise<void>;
  renameItem: (itemId: string, newName: string) => Promise<void>;
  
  openFilePreview: (file: FileItem) => void;
  closeFilePreview: () => void;
  
  updateItemDepartments: (itemId: string, itemType: 'file' | 'folder', departamentos: string[]) => Promise<void>;
  canUserAccessItem: (item: FileItem) => boolean;
}

const FileContext = createContext<FileContextType | null>(null);

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>(['Meus Arquivos']);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [pathHistory, setPathHistory] = useState<Array<{name: string, id: string | null}>>([
    { name: 'Meus Arquivos', id: null }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FilePreview | null>(null);
  
  const [departmentFilter, setDepartmentFilter] = useState<string>('TODOS');
  const [availableDepartments, setAvailableDepartments] = useState<DepartmentFilter[]>([]);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  
  useEffect(() => {
    if (user?.departamento) {
      setUserDepartment(user.departamento);
      console.log('DEBUG - User department definido:', user.departamento);
    } else {
      console.log('DEBUG - User object completo:', user);
      // Verificar campos alternativos
      const dept = user?.departamento || user?.department || user?.dept;
      if (dept) {
        setUserDepartment(dept);
        console.log('DEBUG - User department encontrado em campo alternativo:', dept);
      }
    }
  }, [user]);
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // CORREÇÃO: Melhorar verificação de acesso
  const canUserAccessItem = (item: FileItem): boolean => {
    // Obter departamento diretamente do user se userDepartment estiver null
    const currentUserDepartment = userDepartment || user?.departamento || user?.department;
    
    console.log('Verificando acesso ao item:', {
      itemName: item.name,
      itemType: item.type,
      itemOwner: item.owner?.id,
      currentUser: user?.id,
      userRoles: user?.roles,
      isPublic: item.isPublic,
      departamentoVisibilidade: item.departamentoVisibilidade,
      userDepartment: currentUserDepartment
    });
    
    // Se o usuário é admin, pode acessar tudo
    if (user?.roles?.includes('admin')) {
      console.log('Usuário é admin - acesso liberado');
      return true;
    }
    
    // Se é proprietário
    if (item.owner?.id === user?.id) {
      console.log('Usuário é proprietário - acesso liberado');
      return true;
    }
    
    // CORREÇÃO: Verificar se departamentoVisibilidade contém TODOS
    if (item.departamentoVisibilidade && item.departamentoVisibilidade.includes('TODOS')) {
      console.log('Item visível para TODOS - acesso liberado');
      return true;
    }
    
    // CORREÇÃO: Verificar se contém o departamento do usuário
    if (currentUserDepartment && item.departamentoVisibilidade && item.departamentoVisibilidade.includes(currentUserDepartment)) {
      console.log('Item visível para departamento do usuário - acesso liberado');
      return true;
    }
    
    // Se é público
    if (item.isPublic) {
      console.log('Item é público - acesso liberado');
      return true;
    }
    
    // Se não tem departamentoVisibilidade, permitir acesso
    if (!item.departamentoVisibilidade || item.departamentoVisibilidade.length === 0) {
      console.log('Item sem restrições de departamento - acesso liberado');
      return true;
    }
    
    console.log('Acesso negado');
    return false;
  };
  
  const updateAvailableDepartments = (fileList: FileItem[]) => {
    const departmentCount: Record<string, number> = {
      'TODOS': fileList.length
    };
    
    fileList.forEach(file => {
      if (file.departamentoVisibilidade) {
        file.departamentoVisibilidade.forEach(dept => {
          if (dept !== 'TODOS') {
            departmentCount[dept] = (departmentCount[dept] || 0) + 1;
          }
        });
      }
      
      if (file.owner?.departamento) {
        const ownerDept = file.owner.departamento;
        departmentCount[ownerDept] = (departmentCount[ownerDept] || 0) + 1;
      }
    });
    
    const departments: DepartmentFilter[] = Object.entries(departmentCount).map(([dept, count]) => ({
      value: dept,
      label: dept === 'TODOS' ? 'Todos os Departamentos' : dept,
      count
    }));
    
    setAvailableDepartments(departments);
  };
  
  // CORREÇÃO PRINCIPAL: Função loadFiles com mapeamento correto do allowRAG
const loadFiles = async (folderId: string | null = null) => {
  setIsLoading(true);
  setError(null);
  
  try {
    console.log(`🔍 Buscando arquivos da pasta ${folderId || 'raiz'}`);
    
    const queryParams = new URLSearchParams();
    if (folderId) {
      queryParams.append('folderId', folderId);
    }
    
    const url = `/files${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('📡 URL da requisição:', url);
    
    const response = await api.get(url);
    console.log('📦 Resposta completa da API:', response);
    
    if (!response) {
      throw new Error('Resposta vazia da API');
    }
    
    const folders = Array.isArray(response.folders) ? response.folders : [];
    const filesData = Array.isArray(response.files) ? response.files : [];
    
    console.log(`📂 Recebidos ${folders.length} pastas e ${filesData.length} arquivos`);
    
    // CORREÇÃO: Log detalhado dos dados RAG recebidos
    console.log('📂 Dados das pastas (RAG):');
    folders.forEach((folder: any, index: number) => {
      console.log(`  ${index + 1}. ${folder.name}:`, {
        allowRAG: folder.allowRAG,
        allowRAGType: typeof folder.allowRAG,
        allowRAGValue: String(folder.allowRAG)
      });
    });
    
    console.log('📄 Dados dos arquivos (RAG):');
    filesData.forEach((file: any, index: number) => {
      console.log(`  ${index + 1}. ${file.name}:`, {
        allowRAG: file.allowRAG,
        allowRAGType: typeof file.allowRAG,
        allowRAGValue: String(file.allowRAG)
      });
    });
    
    const mappedFiles: FileItem[] = [
      // CORREÇÃO: Mapear pastas com conversão explícita do allowRAG
      ...folders.map((folder: any) => {
        const allowRAG = Boolean(folder.allowRAG === true || folder.allowRAG === 'true' || folder.allowRAG === 1);
        console.log(`📂 Mapeando pasta "${folder.name}": allowRAG ${folder.allowRAG} → ${allowRAG}`);
        
        return {
          id: folder._id,
          name: folder.name,
          description: folder.description,
          type: 'folder' as const,
          modified: new Date(folder.createdAt || folder.updatedAt || Date.now()).toLocaleDateString('pt-BR'),
          coverImage: folder.coverImage,
          parentId: folder.parentId,
          allowRAG: allowRAG, // CORREÇÃO: Conversão explícita
          departamentoVisibilidade: folder.departamentoVisibilidade || ['TODOS'],
          isRestrito: folder.departamentoVisibilidade && folder.departamentoVisibilidade.length > 0 && !folder.departamentoVisibilidade.includes('TODOS'),
          isPublic: folder.isPublic !== false,
          owner: {
            id: folder.owner?._id || folder.owner?.id || folder.owner,
            name: folder.owner?.nome || folder.owner?.name,
            nome: folder.owner?.nome,
            departamento: folder.owner?.departamento
          }
        };
      }),
      
      // CORREÇÃO: Mapear arquivos e links com conversão explícita do allowRAG
      ...filesData.map((file: any) => {
        const allowRAG = Boolean(file.allowRAG === true || file.allowRAG === 'true' || file.allowRAG === 1);
        console.log(`📄 Mapeando arquivo "${file.name}": allowRAG ${file.allowRAG} → ${allowRAG}`);
        
        return {
          id: file._id,
          name: file.name,
          description: file.description,
          type: file.type || 'file',
          size: file.size ? formatFileSize(file.size) : undefined,
          modified: new Date(file.createdAt || file.updatedAt || Date.now()).toLocaleDateString('pt-BR'),
          extension: file.extension,
          mimeType: file.mimeType,
          linkUrl: file.linkUrl,
          allowDownload: file.allowDownload !== false,
          allowRAG: allowRAG, // CORREÇÃO: Conversão explícita
          departamentoVisibilidade: file.departamentoVisibilidade || ['TODOS'],
          isRestrito: file.departamentoVisibilidade && file.departamentoVisibilidade.length > 0 && !file.departamentoVisibilidade.includes('TODOS'),
          isPublic: file.isPublic !== false,
          folderId: file.folderId,
          originalName: file.originalName,
          owner: {
            id: file.owner?._id || file.owner?.id || file.owner,
            name: file.owner?.nome || file.owner?.name,
            nome: file.owner?.nome,
            departamento: file.owner?.departamento
          }
        };
      })
    ];

    // CORREÇÃO: Log final dos itens mapeados
    console.log(`📦 ${mappedFiles.length} itens mapeados:`);
    mappedFiles.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} (${item.type}): allowRAG = ${item.allowRAG}`);
    });
    
    // CORREÇÃO: Contar itens com RAG habilitado
    const itemsWithRAG = mappedFiles.filter(item => item.allowRAG === true);
    console.log(`✅ ${itemsWithRAG.length} itens com RAG habilitado:`, 
      itemsWithRAG.map(item => `${item.name} (${item.type})`));

    setFiles(mappedFiles);
    updateAvailableDepartments(mappedFiles);
    
  } catch (err: any) {
    console.error('❌ Erro ao carregar arquivos:', err);
    const errorMessage = err.response?.data?.msg || err.message || 'Erro ao carregar arquivos';
    setError(errorMessage);
    toast({
      title: "Erro",
      description: errorMessage,
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
};
  
  useEffect(() => {
    if (isAuthenticated) {
      loadFiles(currentParentId);
    }
  }, [isAuthenticated, currentParentId]);
  
  useEffect(() => {
    let filtered = files;
    
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (file.description && file.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (departmentFilter && departmentFilter !== 'TODOS') {
      filtered = filtered.filter(file => {
        if (!file.departamentoVisibilidade || file.departamentoVisibilidade.length === 0) {
          return true;
        }
        
        if (file.departamentoVisibilidade.includes(departmentFilter)) {
          return true;
        }
        
        if (file.owner?.departamento === departmentFilter) {
          return true;
        }
        
        return false;
      });
    }
    
    setFilteredFiles(filtered);
  }, [files, searchQuery, departmentFilter]);
  
  // CORREÇÃO: Melhorar navegação para pastas
  const navigateToFolder = (folder: FileItem) => {
    if (folder.type !== 'folder') {
      console.log('Item não é uma pasta:', folder);
      return;
    }
    
    if (!user?.roles?.includes('admin') && !canUserAccessItem(folder)) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta pasta.",
        variant: "destructive"
      });
      return;
    }
    
    console.log(`Navegando para a pasta: ${folder.name} (ID: ${folder.id})`);
    
    const newPath = [...currentPath, folder.name];
    const newHistory = [...pathHistory, { name: folder.name, id: folder.id }];
    
    setCurrentPath(newPath);
    setPathHistory(newHistory);
    setCurrentParentId(folder.id);
    
    loadFiles(folder.id);
  };
  
  const navigateToBreadcrumb = async (index: number) => {
    try {
      if (index < 0 || index >= pathHistory.length) {
        console.error('Índice de breadcrumb inválido:', index);
        return;
      }
      
      const targetHistoryItem = pathHistory[index];
      const newPath = currentPath.slice(0, index + 1);
      const newHistory = pathHistory.slice(0, index + 1);
      
      console.log(`Navegando para breadcrumb ${index}: ${targetHistoryItem.name} (ID: ${targetHistoryItem.id})`);
      
      setCurrentPath(newPath);
      setPathHistory(newHistory);
      setCurrentParentId(targetHistoryItem.id);
      
      await loadFiles(targetHistoryItem.id);
    } catch (error) {
      console.error('Erro ao navegar no breadcrumb:', error);
      toast({
        title: "Erro",
        description: "Não foi possível navegar para esta pasta",
        variant: "destructive"
      });
    }
  };
  
  const uploadFile = async (file: File | null, options: UploadOptions = {}) => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      
      if (options.type === 'link') {
        formData.append('type', 'link');
        formData.append('linkName', options.linkName || '');
        formData.append('linkUrl', options.linkUrl || '');
      } else {
        if (!file) {
          throw new Error('Arquivo é obrigatório para upload');
        }
        formData.append('file', file);
        formData.append('type', 'file');
        formData.append('allowDownload', String(options.allowDownload !== false));
      }
      
      if (currentParentId) {
        formData.append('folderId', currentParentId);
      }
      
      if (options.description) {
        formData.append('description', options.description);
      }
      
      const departamentos = options.departamentoVisibilidade || (userDepartment ? [userDepartment] : ['TODOS']);
      formData.append('departamentoVisibilidade', JSON.stringify(departamentos));
      
      console.log('Enviando upload:', {
        type: options.type || 'file',
        fileName: file?.name,
        currentParentId,
        departamentos
      });
      
      await api.upload('/files/upload', formData);
      
      toast({
        title: "Sucesso",
        description: options.type === 'link' ? "Link criado com sucesso" : "Arquivo enviado com sucesso"
      });
      
      await loadFiles(currentParentId);
    } catch (err: any) {
      console.error('Erro no upload:', err);
      const errorMessage = err.response?.data?.msg || err.message || 'Erro no upload';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const createNewFolder = async (
    name: string, 
    description?: string, 
    coverImage?: File | null, 
    options: FolderOptions = {}
  ) => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      
      if (description) {
        formData.append('description', description);
      }
      
      if (currentParentId) {
        formData.append('parentId', currentParentId);
      }
      
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }
	  
	  if (options.allowRAG !== undefined) {
        formData.append('allowRAG', options.allowRAG.toString());
      }
      
      const departamentos = options.departamentoVisibilidade || (userDepartment ? [userDepartment] : ['TODOS']);
      formData.append('departamentoVisibilidade', JSON.stringify(departamentos));
      
      console.log('Criando pasta:', {
        name,
        description,
        currentParentId,
        departamentos,
        hasCoverImage: !!coverImage
      });
      
      await api.upload('/files/folders', formData);
      
      toast({
        title: "Pasta criada",
        description: `A pasta "${name}" foi criada com sucesso.`
      });
      
      await loadFiles(currentParentId);
      setSearchQuery('');
    } catch (error: any) {
      console.error('Erro ao criar pasta:', error);
      const errorMessage = error.response?.data?.msg || error.message || 'Erro ao criar pasta';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const getCurrentFolder = (): FileItem | null => {
  if (!currentParentId) return null;
  return filteredFiles.find(item => item.type === 'folder' && item.id === currentParentId) || null;
  };
  // CORREÇÃO: Melhorar download com verificação de token
  const downloadFile = async (fileId: string, fileName?: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      
      if (file && !user?.roles?.includes('admin') && !canUserAccessItem(file)) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para baixar este arquivo.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('Iniciando download do arquivo:', fileId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }
      
      const baseUrl = api.getBaseUrl();
      const response = await fetch(`${baseUrl}/files/download/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Erro ao baixar arquivo');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || file?.originalName || file?.name || 'arquivo';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Sucesso",
        description: "Download iniciado"
      });
    } catch (err: any) {
      console.error('Erro no download:', err);
      toast({
        title: "Erro",
        description: err.message || 'Erro ao baixar arquivo',
        variant: "destructive"
      });
    }
  };
  
  const deleteItem = async (itemId: string, itemType?: string) => {
    setIsLoading(true);
    
    try {
      const item = files.find(f => f.id === itemId);
      if (!item) {
        throw new Error('Item não encontrado');
      }
      
      if (!user?.roles?.includes('admin') && item.owner?.id !== user?.id) {
        toast({
          title: "Acesso negado",
          description: "Apenas o proprietário ou administradores podem excluir este item.",
          variant: "destructive"
        });
        return;
      }
      
      const type = itemType || item?.type || 'file';
      console.log('Excluindo item:', { itemId, type, itemName: item.name });
      
      await api.delete(`/files/${type}/${itemId}`);
      
      toast({
        title: "Item excluído",
        description: `${type === 'folder' ? 'Pasta' : 'Item'} "${item.name}" excluído com sucesso`
      });
      
      await loadFiles(currentParentId);
    } catch (err: any) {
      console.error('Erro ao excluir item:', err);
      const errorMessage = err.response?.data?.msg || err.message || 'Erro ao excluir item';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const renameItem = async (itemId: string, newName: string) => {
    try {
      const item = files.find(f => f.id === itemId);
      if (!item) {
        throw new Error('Item não encontrado');
      }
      
      if (!user?.roles?.includes('admin') && item.owner?.id !== user?.id) {
        toast({
          title: "Acesso negado",
          description: "Apenas o proprietário ou administradores podem renomear este item.",
          variant: "destructive"
        });
        return;
      }
      
      await api.put(`/files/${item.type}/${itemId}/rename`, { newName });
      
      toast({
        title: "Item renomeado",
        description: `${item.type === 'folder' ? 'Pasta' : 'Item'} renomeado com sucesso`
      });
      
      await loadFiles(currentParentId);
    } catch (error: any) {
      console.error('Erro ao renomear item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível renomear o item",
        variant: "destructive"
      });
    }
  };
  
  const updateItemDepartments = async (itemId: string, itemType: 'file' | 'folder', departamentos: string[]) => {
    try {
      await api.put(`/files/${itemType}/${itemId}/departments`, {
        departamentoVisibilidade: departamentos
      });
      
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === itemId 
            ? { 
                ...file, 
                departamentoVisibilidade: departamentos,
                isRestrito: departamentos.length > 0 && !departamentos.includes('TODOS')
              } 
            : file
        )
      );
      
      toast({
        title: "Permissões atualizadas",
        description: `Departamentos do ${itemType === 'folder' ? 'pasta' : 'arquivo'} atualizados com sucesso.`
      });
    } catch (error: any) {
      console.error('Erro ao atualizar departamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as permissões de departamento.",
        variant: "destructive"
      });
    }
  };
  
  // CORREÇÃO: Melhorar preview de arquivos com autenticação correta
  const openFilePreview = async (file: FileItem) => {
    if (!user?.roles?.includes('admin') && !canUserAccessItem(file)) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para visualizar este arquivo.",
        variant: "destructive"
      });
      return;
    }
    
    if (file.type === 'link' && file.linkUrl) {
      window.open(file.linkUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    if (file.type === 'file') {
      try {
        const canPreview = file.mimeType && (
          file.mimeType.startsWith('image/') ||
          file.mimeType === 'application/pdf' ||
          file.mimeType.startsWith('text/') ||
          file.mimeType.startsWith('video/') ||
          file.mimeType.startsWith('audio/')
        );
        
        // CORREÇÃO: Incluir token na URL de preview
        const baseUrl = api.getBaseUrl();
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Token de autenticação não encontrado');
        }
        
        // Para preview, construir URL com token nos parâmetros para evitar erro 401
        const previewUrl = `${baseUrl}/files/preview/${file.id}?token=${encodeURIComponent(token)}`;
        
        const preview: FilePreview = {
          fileId: file.id,
          fileName: file.name,
          fileType: file.mimeType || '',
          previewUrl,
          canPreview: canPreview || false
        };
        
        setPreviewFile(preview);
      } catch (error) {
        console.error('Erro ao abrir preview:', error);
        toast({
          title: "Erro",
          description: "Não foi possível abrir a visualização do arquivo",
          variant: "destructive"
        });
      }
    }
  };
  
  const closeFilePreview = () => {
    if (previewFile?.previewUrl && previewFile.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewFile.previewUrl);
    }
    setPreviewFile(null);
  };
  
  const refreshFiles = async () => {
    await loadFiles(currentParentId);
  };
  
  return (
    <FileContext.Provider value={{
      files,
      currentPath,
      currentParentId,
      currentFolderId: currentParentId,
      searchQuery,
      filteredFiles,
      isLoading,
      error,
      previewFile,
	  getCurrentFolder,
      
      departmentFilter,
      availableDepartments,
      userDepartment,
      
      setSearchQuery,
      setDepartmentFilter,
      refreshFiles,
      
      navigateToFolder,
      navigateToBreadcrumb,
      
      uploadFile,
      createNewFolder,
      downloadFile,
      deleteItem,
      renameItem,
      
      openFilePreview,
      closeFilePreview,
      
      updateItemDepartments,
      canUserAccessItem
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