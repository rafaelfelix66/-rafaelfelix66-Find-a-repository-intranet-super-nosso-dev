// src/services/fileService.ts
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

// Converter um objeto de arquivo da API para o formato usado pelo FileContext
const mapApiFileToFileItem = (file: ApiFile): FileItem => {
  return {
    id: file._id,
    name: file.name,
    type: 'file',
    // Não incluímos o icon aqui, será definido no componente
    iconType: file.extension,
    size: formatFileSize(file.size),
    modified: formatDate(file.updatedAt || file.createdAt),
    path: file.path,
    parentId: file.folderId,
    extension: file.extension
  };
};

// Converter um objeto de pasta da API para o formato usado pelo FileContext
const mapApiFolderToFileItem = (folder: ApiFolder): FileItem => {
  return {
    id: folder._id,
    name: folder.name,
    type: 'folder',
    // Não incluímos o icon aqui, será definido no componente
    iconType: 'folder',
    modified: formatDate(folder.updatedAt || folder.createdAt),
    path: folder.name,
    parentId: folder.parentId
  };
};

// Serviços de arquivos
export const fileService = {
  // Obter arquivos e pastas
  getFiles: async (folderId?: string | null): Promise<FileItem[]> => {
    try {
      const query = folderId ? `?folderId=${folderId}` : '';
      const data: FileListResponse = await api.get(`/files${query}`);
      
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
  createFolder: async (name: string, parentId?: string | null): Promise<FileItem> => {
    try {
      const data: ApiFolder = await api.post('/files/folder', { 
        name, 
        parentId: parentId || null 
      });
      
      return mapApiFolderToFileItem(data);
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
  
  // Excluir item (arquivo ou pasta)
  deleteItem: async (itemId: string, itemType: 'file' | 'folder'): Promise<void> => {
    try {
      await api.delete(`/files/${itemType}/${itemId}`);
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      throw error;
    }
  }
};