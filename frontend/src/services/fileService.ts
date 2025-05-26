// src/services/fileService.ts - Versão Melhorada Mantendo Funcionalidades Existentes
import { api } from "./api";
import { FileItem } from "@/contexts/FileContext";

export interface ApiFile {
  _id: string;
  name: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  extension: string;
  folderId: string | null;
  owner: {
    _id: string;
    nome: string;
    departamento?: string;
  };
  sharedWith: Array<{
    user: string;
    access: string;
  }>;
  isPublic: boolean;
  // NOVO: Campos adicionados
  type: 'file' | 'link';
  linkUrl?: string;
  allowDownload: boolean;
  departamentoVisibilidade: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiFolder {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  parentId: string | null;
  owner: {
    _id: string;
    nome: string;
    departamento?: string;
  };
  sharedWith: Array<{
    user: string;
    access: string;
  }>;
  isPublic: boolean;
  // NOVO: Campos adicionados
  departamentoVisibilidade: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FileListResponse {
  folders: ApiFolder[];
  files: ApiFile[];
}

// NOVO: Interface para capacidades de preview
export interface FilePreviewCapability {
  canPreview: boolean;
  previewType: 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'none';
  requiresDownload: boolean;
}

// Funções auxiliares mantidas e melhoradas
const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Data desconhecida";
  }
};

// Função melhorada para identificar ícone baseado no tipo de arquivo
const getIconType = (file: ApiFile): string => {
  // Para links, retornar tipo específico
  if (file.type === 'link') return 'link';
  
  const mimeType = file.mimeType?.toLowerCase() || '';
  const extension = file.extension?.toLowerCase() || '';
  
  // Imagens
  if (mimeType.startsWith('image/')) return 'image';
  
  // Documentos
  if (['pdf'].includes(extension) || mimeType === 'application/pdf') return 'pdf';
  if (['doc', 'docx'].includes(extension) || mimeType.includes('word')) return 'document';
  if (['txt', 'rtf'].includes(extension) || mimeType.startsWith('text/')) return 'text';
  if (['xls', 'xlsx', 'csv'].includes(extension) || mimeType.includes('spreadsheet')) return 'spreadsheet';
  if (['ppt', 'pptx'].includes(extension) || mimeType.includes('presentation')) return 'presentation';
  
  // Vídeos e áudio
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  
  // Arquivos compactados
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'archive';
  
  // Código fonte
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'php', 'py', 'java', 'c', 'cpp', 'json', 'xml'].includes(extension)) return 'code';
  
  // Padrão
  return 'file';
};

// MELHORADO: Converter um objeto de arquivo da API para o formato usado pelo FileContext
const mapApiFileToFileItem = (file: ApiFile): FileItem => {
  return {
    id: file._id,
    name: file.name,
    description: file.description,
    type: file.type || 'file', // NOVO: Suporte a diferentes tipos
    iconType: getIconType(file),
    size: file.size ? formatFileSize(file.size) : undefined,
    modified: formatDate(file.updatedAt || file.createdAt),
    path: file.path,
    parentId: file.folderId,
    extension: file.extension,
    mimeType: file.mimeType,
    originalName: file.originalName,
    // NOVO: Campos adicionais
    linkUrl: file.linkUrl,
    allowDownload: file.allowDownload !== false, // Default true
    departamentoVisibilidade: file.departamentoVisibilidade || ['TODOS'],
    isPublic: file.isPublic,
    isRestrito: file.departamentoVisibilidade && 
                file.departamentoVisibilidade.length > 0 && 
                !file.departamentoVisibilidade.includes('TODOS'),
    owner: file.owner ? {
      id: file.owner._id,
      name: file.owner.nome,
      nome: file.owner.nome,
      departamento: file.owner.departamento
    } : undefined
  };
};

// MELHORADO: Converter um objeto de pasta da API para o formato usado pelo FileContext
const mapApiFolderToFileItem = (folder: ApiFolder): FileItem => {
  return {
    id: folder._id,
    name: folder.name,
    description: folder.description,
    type: 'folder',
    iconType: 'folder',
    modified: formatDate(folder.updatedAt || folder.createdAt),
    path: folder.name,
    parentId: folder.parentId,
    coverImage: folder.coverImage,
    // NOVO: Campos adicionais
    departamentoVisibilidade: folder.departamentoVisibilidade || ['TODOS'],
    isPublic: folder.isPublic,
    isRestrito: folder.departamentoVisibilidade && 
                folder.departamentoVisibilidade.length > 0 && 
                !folder.departamentoVisibilidade.includes('TODOS'),
    owner: folder.owner ? {
      id: folder.owner._id,
      name: folder.owner.nome,
      nome: folder.owner.nome,
      departamento: folder.owner.departamento
    } : undefined
  };
};

// Serviços de arquivos melhorados
export const fileService = {
  // MANTIDO: Obter arquivos e pastas
  getFiles: async (folderId?: string | null): Promise<FileItem[]> => {
    try {
      const query = folderId ? `?folderId=${folderId}` : '';
      const data: FileListResponse = await api.get(`/files${query}`);
      
      console.log('API response:', data);
      
      // Validar resposta da API
      if (!data || typeof data !== 'object') {
        throw new Error('Resposta inválida da API');
      }
      
      // Garantir que folders e files sejam arrays
      const folders = Array.isArray(data.folders) ? data.folders : [];
      const files = Array.isArray(data.files) ? data.files : [];
      
      // Mapear pastas
      const folderItems = folders.map(mapApiFolderToFileItem);
      
      // Mapear arquivos
      const fileItems = files.map(mapApiFileToFileItem);
      
      // Retornar todos os itens
      return [...folderItems, ...fileItems];
    } catch (error) {
      console.error('Erro ao obter arquivos:', error);
      throw error;
    }
  },
  
  // MELHORADO: Criar uma nova pasta com suporte a capa e departamentos
  createFolder: async (
    name: string, 
    description?: string,  
    parentId?: string | null, 
    coverImage?: File | null,
    departamentoVisibilidade?: string[]
  ): Promise<FileItem> => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      
      if (description) {
        formData.append('description', description);
      }
      
      if (parentId) {
        formData.append('parentId', parentId);
      }
      
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }
      
      if (departamentoVisibilidade) {
        formData.append('departamentoVisibilidade', JSON.stringify(departamentoVisibilidade));
      }
      
      const data: ApiFolder = await api.upload('/files/folders', formData);
      return mapApiFolderToFileItem(data);
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      throw error;
    }
  },
  
  // MELHORADO: Upload de arquivo com suporte a links e departamentos
  uploadFile: async (
    file: File | null, 
    folderId?: string | null,
    options?: {
      description?: string;
      departamentoVisibilidade?: string[];
      allowDownload?: boolean;
      type?: 'file' | 'link';
      linkName?: string;
      linkUrl?: string;
    }
  ): Promise<FileItem> => {
    try {
      const formData = new FormData();
      
      if (options?.type === 'link') {
        // Para links
        if (!options.linkName || !options.linkUrl) {
          throw new Error('Nome e URL são obrigatórios para links');
        }
        
        formData.append('type', 'link');
        formData.append('linkName', options.linkName);
        formData.append('linkUrl', options.linkUrl);
      } else {
        // Para arquivos físicos
        if (!file) {
          throw new Error('Arquivo é obrigatório para upload');
        }
        
        formData.append('file', file);
        formData.append('type', 'file');
        
        if (options?.allowDownload !== undefined) {
          formData.append('allowDownload', String(options.allowDownload));
        }
      }
      
      if (folderId) {
        formData.append('folderId', folderId);
      }
      
      if (options?.description) {
        formData.append('description', options.description);
      }
      
      if (options?.departamentoVisibilidade) {
        formData.append('departamentoVisibilidade', JSON.stringify(options.departamentoVisibilidade));
      }
      
      const data: ApiFile = await api.upload('/files/upload', formData);
      return mapApiFileToFileItem(data);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  },
  
  // MANTIDO E MELHORADO: Baixar arquivo
  downloadFile: async (fileId: string, originalFileName?: string): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      
      const baseUrl = api.getBaseUrl();
      
      // Fazer requisição com autenticação
      const response = await fetch(`${baseUrl}/files/download/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erro ao baixar arquivo: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.msg || errorMessage;
        } catch (e) {
          // Se não conseguir parsear como JSON, usar mensagem padrão
        }
        
        throw new Error(errorMessage);
      }
      
      // Obter o blob da resposta
      const blob = await response.blob();
      
      // Determinar nome do arquivo
      let downloadFileName = originalFileName;
      
      // Tentar obter nome do cabeçalho Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch && fileNameMatch[1]) {
          downloadFileName = fileNameMatch[1];
        }
      }
      
      // Fallback para nome genérico
      if (!downloadFileName) {
        downloadFileName = 'arquivo_baixado';
        
        // Tentar adicionar extensão baseada no tipo MIME
        const contentType = blob.type;
        if (contentType) {
          let extension = contentType.split('/').pop();
          
          // Mapear tipos MIME comuns para extensões
          const mimeToExt: Record<string, string> = {
            'plain': 'txt',
            'jpeg': 'jpg',
            'png': 'png',
            'pdf': 'pdf',
            'msword': 'doc',
            'vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'vnd.ms-excel': 'xls',
            'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
          };
          
          if (extension && mimeToExt[extension]) {
            extension = mimeToExt[extension];
          }
          
          if (extension && extension !== 'octet-stream') {
            downloadFileName += `.${extension}`;
          }
        }
      }
      
      // Criar URL para o blob e fazer download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFileName;
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      throw error;
    }
  },
  
  // NOVO: Obter capacidades de preview
  getPreviewCapability: (mimeType: string, extension?: string): FilePreviewCapability => {
    if (!mimeType) {
      return { canPreview: false, previewType: 'none', requiresDownload: true };
    }
    
    const mime = mimeType.toLowerCase();
    
    if (mime.startsWith('image/')) {
      return { canPreview: true, previewType: 'image', requiresDownload: false };
    }
    
    if (mime === 'application/pdf') {
      return { canPreview: true, previewType: 'pdf', requiresDownload: false };
    }
    
    if (mime.startsWith('video/')) {
      return { canPreview: true, previewType: 'video', requiresDownload: false };
    }
    
    if (mime.startsWith('audio/')) {
      return { canPreview: true, previewType: 'audio', requiresDownload: false };
    }
    
    if (mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml') {
      return { canPreview: true, previewType: 'text', requiresDownload: false };
    }
    
    return { canPreview: false, previewType: 'none', requiresDownload: true };
  },
  
  // MANTIDO: Obter URL para visualização
  getFilePreviewUrl: (fileId: string): string => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const baseUrl = api.getBaseUrl();
    return `${baseUrl}/files/preview/${fileId}`;
  },
  
  // MANTIDO: Verificar se o arquivo pode ser visualizado inline
  canPreviewFile: (mimeType?: string, extension?: string): boolean => {
    if (!mimeType && !extension) return false;
    
    const capability = fileService.getPreviewCapability(mimeType || '', extension);
    return capability.canPreview;
  },
  
  // MANTIDO: Obter informações detalhadas sobre um arquivo
  getFileInfo: async (fileId: string): Promise<ApiFile> => {
    try {
      const data = await api.get(`/files/info/${fileId}`);
      return data;
    } catch (error) {
      console.error('Erro ao obter informações do arquivo:', error);
      throw error;
    }
  },
  
  // MANTIDO: Excluir item (arquivo ou pasta)
  deleteItem: async (itemId: string, itemType: 'file' | 'folder'): Promise<void> => {
    try {
      await api.delete(`/files/${itemType}/${itemId}`);
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      throw error;
    }
  },
  
  // NOVO: Renomear item
  renameItem: async (itemId: string, itemType: 'file' | 'folder', newName: string): Promise<void> => {
    try {
      await api.put(`/files/${itemType}/${itemId}/rename`, { newName });
    } catch (error) {
      console.error('Erro ao renomear item:', error);
      throw error;
    }
  },
  
  // NOVO: Atualizar descrição do item
  updateItemDescription: async (itemId: string, itemType: 'file' | 'folder', description: string): Promise<void> => {
    try {
      await api.put(`/files/${itemType}/${itemId}/description`, { description });
    } catch (error) {
      console.error('Erro ao atualizar descrição:', error);
      throw error;
    }
  },
  
  // NOVO: Atualizar departamentos de visibilidade
  updateItemDepartments: async (itemId: string, itemType: 'file' | 'folder', departamentos: string[]): Promise<void> => {
    try {
      await api.put(`/files/${itemType}/${itemId}/departments`, { departamentoVisibilidade: departamentos });
    } catch (error) {
      console.error('Erro ao atualizar departamentos:', error);
      throw error;
    }
  },
  
  // MANTIDO: Compartilhar um item com outros usuários
  shareItem: async (itemId: string, itemType: 'file' | 'folder', userId: string, access: 'read' | 'edit'): Promise<void> => {
    try {
      await api.post('/files/share', {
        itemId,
        itemType,
        userId,
        access
      });
    } catch (error) {
      console.error('Erro ao compartilhar item:', error);
      throw error;
    }
  },
  
  // MANTIDO: Tornar um item público ou privado
  toggleItemPublic: async (itemId: string, itemType: 'file' | 'folder', isPublic: boolean): Promise<void> => {
    try {
      await api.put(`/files/${itemType}/${itemId}/public`, { isPublic });
    } catch (error) {
      console.error('Erro ao mudar visibilidade do item:', error);
      throw error;
    }
  },
  
  // NOVO: Validação de arquivo para upload
  validateFile: (file: File, maxSizeInMB: number = 100, allowedTypes?: string[]): { isValid: boolean; error?: string } => {
    // Validar tamanho
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return {
        isValid: false,
        error: `Arquivo muito grande. Tamanho máximo permitido: ${maxSizeInMB}MB`
      };
    }
    
    // Validar tipo se especificado
    if (allowedTypes && allowedTypes.length > 0) {
      const isTypeAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });
      
      if (!isTypeAllowed) {
        return {
          isValid: false,
          error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
        };
      }
    }
    
    return { isValid: true };
  },
  
  // NOVO: Obter estatísticas de arquivos (para admins)
  getFileStats: async (): Promise<any> => {
    try {
      return await api.get('/files/stats');
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }
};

// Exportar tipos para uso em outros componentes
export type { FilePreviewCapability, ApiFile, ApiFolder, FileListResponse };