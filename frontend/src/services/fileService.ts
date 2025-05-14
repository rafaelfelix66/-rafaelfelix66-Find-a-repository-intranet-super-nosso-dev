// src/services/fileService.ts (Versão completa e corrigida)
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
  };
  sharedWith: Array<{
    user: string;
    access: string;
  }>;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiFolder {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string
  parentId: string | null;
  owner: {
    _id: string;
    nome: string;
  };
  sharedWith: Array<{
    user: string;
    access: string;
  }>;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileListResponse {
  folders: ApiFolder[];
  files: ApiFile[];
}

// Funções auxiliares
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

// Função para identificar ícone baseado no tipo de arquivo
const getIconType = (file: ApiFile): string => {
  const mimeType = file.mimeType.toLowerCase();
  const extension = file.extension?.toLowerCase() || '';
  
  // Imagens
  if (mimeType.startsWith('image/')) return 'image';
  
  // Documentos
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) return 'document';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'spreadsheet';
  if (['ppt', 'pptx'].includes(extension)) return 'presentation';
  
  // Vídeos e áudio
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  
  // Arquivos compactados
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'archive';
  
  // Código fonte
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'php', 'py', 'java', 'c', 'cpp'].includes(extension)) return 'code';
  
  // Padrão
  return 'file';
};

// Converter um objeto de arquivo da API para o formato usado pelo FileContext
const mapApiFileToFileItem = (file: ApiFile): FileItem => {
  return {
    id: file._id,
    name: file.name,
    type: 'file',
    iconType: getIconType(file),
    size: formatFileSize(file.size),
    modified: formatDate(file.updatedAt || file.createdAt),
    path: file.path,
    parentId: file.folderId,
    extension: file.extension,
    mimeType: file.mimeType, // Adicionado mimeType para uso na visualização
    originalName: file.originalName, // Adicionado nome original para download
    owner: file.owner ? {
      id: file.owner._id,
      name: file.owner.nome
    } : undefined // Adicionado informações do proprietário
  };
};

// Converter um objeto de pasta da API para o formato usado pelo FileContext
const mapApiFolderToFileItem = (folder: ApiFolder): FileItem => {
  return {
    id: folder._id,
    name: folder.name,
	description: folder.description,  
    coverImage: folder.coverImage,    
    type: 'folder',
    iconType: 'folder',
    modified: formatDate(folder.updatedAt || folder.createdAt),
    path: folder.name,
    parentId: folder.parentId,
    owner: folder.owner ? {
      id: folder.owner._id,
      name: folder.owner.nome
    } : undefined // Adicionado informações do proprietário
  };
};

// Serviços de arquivos
export const fileService = {
  // Obter arquivos e pastas
  getFiles: async (folderId?: string | null): Promise<FileItem[]> => {
    try {
      const query = folderId ? `?folderId=${folderId}` : '';
      const data: FileListResponse = await api.get(`/files${query}`);
      
      console.log('API response:', data);
      
      // Mapear pastas
      const folderItems = data.folders.map(mapApiFolderToFileItem);
      
      // Mapear arquivos
      const fileItems = data.files.map(mapApiFileToFileItem);
      
      // Retornar todos os itens
      return [...folderItems, ...fileItems];
    } catch (error) {
      console.error('Erro ao obter arquivos:', error);
      throw error;
    }
  },
  
  // Criar uma nova pasta
  createFolder: async (
    name: string, 
	description?: string,  
	parentId?: string | null, 
	coverImage?: File | null
  ): Promise<FileItem> => {
    try {
    // Se tem imagem de capa, usar FormData
    if (coverImage) {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description || '');
      
      if (parentId) {
        formData.append('parentId', parentId);
      }
      
      formData.append('coverImage', coverImage);
      
      // Usar upload para enviar FormData
      const data: ApiFolder = await api.upload('/files/folders', formData);
      return mapApiFolderToFileItem(data);
    } else {
      // Sem imagem, usar POST normal
      const data: ApiFolder = await api.post('/files/folders', { 
        name, 
        description: description || '',
        parentId: parentId || null 
      });
      
      return mapApiFolderToFileItem(data);
    }
  } catch (error) {
    console.error('Erro ao criar pasta:', error);
    throw error;
  }
},
  
  // Fazer upload de arquivo
  uploadFile: async (file: File, folderId?: string | null): Promise<FileItem> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (folderId) {
        formData.append('folderId', folderId);
      }
      
      const data: ApiFile = await api.upload('/files/upload', formData);
      
      return mapApiFileToFileItem(data);
    } catch (error) {
      console.error('Erro ao fazer upload de arquivo:', error);
      throw error;
    }
  },
  
  // Baixar arquivo
  downloadFile: async (fileId: string, originalFileName?: string): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      
      const baseUrl = api.getBaseUrl();
      
      // Primeiro, obter os detalhes do arquivo se o nome original não foi fornecido
      if (!originalFileName) {
        try {
          // Faça uma chamada para obter informações específicas do arquivo
          const fileDetails = await api.get(`/files/info/${fileId}`);
          if (fileDetails && fileDetails.originalName) {
            originalFileName = fileDetails.originalName;
          }
        } catch (error) {
          console.warn("Não foi possível obter detalhes do arquivo:", error);
        }
      }
      
      // Fazer requisição com autenticação
      const response = await fetch(`${baseUrl}/files/download/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        throw new Error(`Erro ao baixar arquivo: ${response.status}`);
      }
      
      // Obter o blob da resposta
      const blob = await response.blob();
      
      // Nome do arquivo final
      let downloadFileName = originalFileName || 'arquivo_baixado';
      
      // Adicionar extensão se não tiver, baseada no tipo MIME
      if (!downloadFileName.includes('.')) {
        const contentType = blob.type;
        let extension = contentType.split('/').pop();
        
        // Mapear tipos MIME comuns para extensões
        if (extension === 'plain') extension = 'txt';
        if (extension === 'jpeg') extension = 'jpg';
        if (extension === 'document') extension = 'docx';
        if (extension === 'sheet') extension = 'xlsx';
        
        if (extension && extension !== 'octet-stream') {
          downloadFileName += `.${extension}`;
        }
      }
      
      // Criar URL para o blob
      const url = window.URL.createObjectURL(blob);
      
      // Criar um link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFileName;
      
      // Adicionar o link ao DOM, clicar nele e removê-lo
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      throw error;
    }
  },
  
  // NOVA FUNÇÃO: Obter preview/visualização do arquivo
  getFilePreviewUrl: (fileId: string): string => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const baseUrl = api.getBaseUrl();
    return `${baseUrl}/files/preview/${fileId}`;
  },
  
  // Verificar se o arquivo pode ser visualizado inline
  canPreviewFile: (mimeType?: string, extension?: string): boolean => {
    if (!mimeType && !extension) return false;
    
    // Lista de tipos que podem ser visualizados diretamente
    const previewableMimeTypes = [
      // Imagens
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Documentos
      'application/pdf',
      // Vídeos
      'video/mp4', 'video/webm', 'video/ogg',
      // Textos
      'text/plain', 'text/html', 'text/css', 'text/javascript',
      // Outros
      'application/json', 'application/xml'
    ];
    
    const previewableExtensions = [
      // Imagens
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
      // Documentos
      'pdf', 'txt',
      // Vídeos
      'mp4', 'webm', 'ogg',
      // Código
      'html', 'css', 'js', 'json', 'xml'
    ];
    
    return previewableMimeTypes.some(type => mimeType?.startsWith(type)) || 
           previewableExtensions.includes(extension?.toLowerCase() || '');
  },
  
  // Obter informações detalhadas sobre um arquivo
  getFileInfo: async (fileId: string): Promise<ApiFile> => {
    try {
      const data = await api.get(`/files/info/${fileId}`);
      return data;
    } catch (error) {
      console.error('Erro ao obter informações do arquivo:', error);
      throw error;
    }
  },
  
  // Excluir item (arquivo ou pasta)
  deleteItem: async (itemId: string, itemType: 'file' | 'folder'): Promise<void> => {
    try {
      await api.delete(`/files/${itemType}/${itemId}`);
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      throw error;
    }
  },
  
  // Compartilhar um item com outros usuários
  shareItem: async (itemId: string, itemType: 'file' | 'folder', userId: string, access: 'read' | 'write'): Promise<void> => {
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
  
  // Tornar um item público ou privado
  toggleItemPublic: async (itemId: string, itemType: 'file' | 'folder', isPublic: boolean): Promise<void> => {
    try {
      // Esta função precisará ser implementada no backend
      await api.put(`/files/${itemType}/${itemId}/public`, { isPublic });
    } catch (error) {
      console.error('Erro ao mudar visibilidade do item:', error);
      throw error;
    }
  }
};