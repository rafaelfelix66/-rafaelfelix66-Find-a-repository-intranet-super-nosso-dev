// src/services/downloadService.ts
import { api } from './api';

export const downloadService = {
  /**
   * Download de material com nome e extensão corretos
   */
  downloadMaterial: async (courseId: string, materialId: string, materialName?: string) => {
    try {
      console.log('=== INICIANDO DOWNLOAD ===');
      console.log('Course ID:', courseId);
      console.log('Material ID:', materialId);
      console.log('Material Name:', materialName);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      
      const baseUrl = api.getBaseUrl();
      const downloadUrl = `${baseUrl}/courses/${courseId}/materials/${materialId}/download`;
      
      console.log('Download URL:', downloadUrl);
      
      // Fazer requisição com fetch para controle total
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error(`Erro no download: ${response.status}`);
      }
      
      // Obter o blob
      const blob = await response.blob();
      console.log('Blob obtido:', {
        size: blob.size,
        type: blob.type
      });
      
      // Extrair nome do arquivo dos headers
      let filename = materialName || 'download';
      
      const contentDisposition = response.headers.get('Content-Disposition');
      console.log('Content-Disposition header:', contentDisposition);
      
      if (contentDisposition) {
        // Tentar extrair filename do header
        const filenameMatch = contentDisposition.match(/filename\*?=['"]?([^'";\s]+)['"]?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
          console.log('Filename extraído do header:', filename);
        }
      }
      
      // Garantir que o filename tem extensão
      const contentType = response.headers.get('Content-Type');
      console.log('Content-Type:', contentType);
      
      if (contentType && !filename.includes('.')) {
        const extension = getExtensionFromMimeType(contentType);
        if (extension) {
          filename += extension;
          console.log('Extensão adicionada:', filename);
        }
      }
      
      // Criar URL para download
      const url = window.URL.createObjectURL(blob);
      
      // Criar elemento de download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      console.log('=== EXECUTANDO DOWNLOAD ===');
      console.log('Final filename:', filename);
      console.log('Blob URL:', url);
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('Cleanup concluído');
      }, 100);
      
      return { success: true, filename };
      
    } catch (error) {
      console.error('Erro no download:', error);
      throw error;
    }
  }
};

/**
 * Mapear MIME types para extensões
 */
function getExtensionFromMimeType(mimeType: string): string | null {
  const mimeToExt: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'audio/mpeg': '.mp3',
    'text/plain': '.txt',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar'
  };
  
  return mimeToExt[mimeType.toLowerCase()] || null;
}