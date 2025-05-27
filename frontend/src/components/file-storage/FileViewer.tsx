// src/components/file-storage/FileViewer.tsx - CORS Corrigido
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { FileItem } from '@/contexts/FileContext';
import { api } from '@/services/api';

interface FileViewerProps {
  file: FileItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: (fileId: string) => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({ 
  file, 
  isOpen,
  onOpenChange,
  onDownload
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  
  // Limpar dados quando o arquivo muda
  useEffect(() => {
    if (file) {
      setLoadError(null);
      setPreviewData(null);
      if (file.type === 'file' && canPreviewFile(file)) {
        loadPreview();
      }
    }
  }, [file]);
  
  // Verificar se pode fazer preview
  const canPreviewFile = (file: FileItem): boolean => {
    return file.type === 'file' && file.mimeType && (
      file.mimeType.startsWith('image/') ||
      file.mimeType === 'application/pdf' ||
      file.mimeType.startsWith('text/') ||
      file.mimeType.startsWith('video/') ||
      file.mimeType.startsWith('audio/')
    );
  };
  
  // CORREÇÃO: Carregar preview sem credentials para evitar erro CORS
  const loadPreview = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }
      
      const baseUrl = api.getBaseUrl();
      
      // CORREÇÃO: Remover credentials: 'include' para evitar conflito CORS
      const response = await fetch(`${baseUrl}/files/preview/${file.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token,
          'Accept': '*/*'
        }
        // REMOVIDO: credentials: 'include' - causa erro CORS com wildcard
      });
      
      console.log('Preview response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Preview error response:', errorText);
        
        let errorMessage = `Erro ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.msg || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const contentType = response.headers.get('Content-Type') || file.mimeType || '';
      
      if (contentType.startsWith('image/') || 
          contentType === 'application/pdf' ||
          contentType.startsWith('video/') ||
          contentType.startsWith('audio/')) {
        
        // Para arquivos binários, criar blob URL
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPreviewData(blobUrl);
        
      } else if (contentType.startsWith('text/') || 
                 contentType.includes('json') ||
                 contentType.includes('xml')) {
        
        // Para arquivos de texto, obter como string
        const text = await response.text();
        setPreviewData(text);
      } else {
        throw new Error('Tipo de arquivo não suportado para visualização');
      }
      
    } catch (error) {
      console.error('Erro ao carregar preview:', error);
      setLoadError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manipulador para fazer download
  const handleDownload = async () => {
    if (!file || !file.allowDownload) return;
    
    setIsLoading(true);
    try {
      if (onDownload) {
        await onDownload(file.id);
      } else {
        // Fazer download direto - CORREÇÃO: sem credentials
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token de autenticação não encontrado');
        }
        
        const baseUrl = api.getBaseUrl();
        const response = await fetch(`${baseUrl}/files/download/${file.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-auth-token': token
          }
          // REMOVIDO: credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Erro ao baixar arquivo');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName || file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      setLoadError(error instanceof Error ? error.message : 'Erro ao baixar arquivo');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Abrir em nova aba
  const handleOpenInNewTab = () => {
    if (!file) return;
    
    if (file.type === 'link' && file.linkUrl) {
      window.open(file.linkUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    if (previewData && previewData.startsWith('blob:')) {
      window.open(previewData, '_blank', 'noopener,noreferrer');
    }
  };
  
  // Cleanup quando componente desmonta ou arquivo muda
  useEffect(() => {
    return () => {
      if (previewData && previewData.startsWith('blob:')) {
        URL.revokeObjectURL(previewData);
      }
    };
  }, [previewData]);
  
  // Não exibir nada se não houver arquivo
  if (!file) return null;
  
  // Renderizar preview baseado no tipo
  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-[70vh] bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Carregando preview...</p>
          </div>
        </div>
      );
    }
    
    if (loadError) {
      return (
        <div className="flex items-center justify-center h-[70vh] bg-gray-50 dark:bg-gray-900">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Erro ao carregar preview</h3>
            <p className="text-red-600 text-sm mb-4">{loadError}</p>
            <div className="flex gap-2 justify-center">
              {file.allowDownload && (
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar arquivo
                </Button>
              )}
              <Button onClick={() => setLoadError(null)} variant="outline">
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Se for um link
    if (file.type === 'link') {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50 dark:bg-gray-900">
          <ExternalLink size={48} className="text-blue-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Link Externo</h3>
          <p className="text-gray-500 text-sm mb-4 text-center max-w-md">
            {file.description || 'Clique para abrir o link em uma nova aba'}
          </p>
          <div className="flex gap-2">
            <Button onClick={handleOpenInNewTab} className="bg-blue-500 hover:bg-blue-600">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir Link
            </Button>
          </div>
          {file.linkUrl && (
            <p className="text-xs text-gray-400 mt-2 break-all max-w-md text-center">
              {file.linkUrl}
            </p>
          )}
        </div>
      );
    }
    
    // Se não pode fazer preview
    if (!canPreviewFile(file)) {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50 dark:bg-gray-900">
          <FileText size={48} className="text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Visualização não disponível</h3>
          <p className="text-gray-500 text-sm mb-4 text-center">
            Este tipo de arquivo não pode ser visualizado diretamente no navegador.
          </p>
          <div className="flex gap-2">
            {file.allowDownload && (
              <Button onClick={handleDownload} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Baixando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar arquivo
                  </>
                )}
              </Button>
            )}
          </div>
          {!file.allowDownload && (
            <p className="text-red-500 text-xs mt-2">Download não permitido para este arquivo</p>
          )}
        </div>
      );
    }
    
    // Se não tem dados de preview ainda
    if (!previewData) {
      return (
        <div className="flex items-center justify-center h-[70vh] bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Preparando visualização...</p>
          </div>
        </div>
      );
    }
    
    // Renderizar baseado no tipo de arquivo
    const mimeType = file.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-[70vh] bg-gray-50 dark:bg-gray-900 p-4">
          <img 
            src={previewData} 
            alt={file.name} 
            className="max-h-full max-w-full object-contain shadow-lg" 
            onError={() => setLoadError('Erro ao carregar imagem')}
          />
        </div>
      );
    }
    
    if (mimeType === 'application/pdf') {
      return (
        <div className="h-[70vh]">
          <iframe 
            src={previewData} 
            title={file.name}
            className="w-full h-full border-0"
            onError={() => setLoadError('Erro ao carregar PDF')}
          />
        </div>
      );
    }
    
    if (mimeType.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center h-[70vh] bg-black">
          <video 
            src={previewData}
            controls
            className="max-h-full max-w-full"
            onError={() => setLoadError('Erro ao carregar vídeo')}
          >
            Seu navegador não suporta a reprodução deste vídeo.
          </video>
        </div>
      );
    }
    
    if (mimeType.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-center font-medium mb-4 text-gray-900 dark:text-gray-100">
              {file.name}
            </h3>
            <audio 
              src={previewData}
              controls
              className="w-full"
              onError={() => setLoadError('Erro ao carregar áudio')}
            >
              Seu navegador não suporta a reprodução deste áudio.
            </audio>
          </div>
        </div>
      );
    }
    
    if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml')) {
      return (
        <div className="h-[70vh] overflow-auto bg-gray-50 dark:bg-gray-900 p-4">
          <pre className="text-sm whitespace-pre-wrap bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
            {previewData}
          </pre>
        </div>
      );
    }
    
    // Fallback
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50 dark:bg-gray-900">
        <FileText size={48} className="text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Tipo de arquivo não suportado</h3>
        <p className="text-gray-500 text-sm mb-4">
          Não é possível visualizar este tipo de arquivo no navegador.
        </p>
        <div className="flex gap-2">
          {file.allowDownload && (
            <Button onClick={handleDownload} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Baixando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar arquivo
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-medium text-lg truncate pr-4">
                {file.name}
              </DialogTitle>
              <DialogDescription className="truncate">
                {file.type === 'link' 
                  ? 'Link externo' 
                  : file.description || 'Visualização do arquivo'
                }
              </DialogDescription>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {file.type === 'link' ? (
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleOpenInNewTab} 
                  title="Abrir link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleOpenInNewTab} 
                    title="Abrir em nova aba"
                    disabled={!previewData}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  {file.allowDownload && (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleDownload} 
                      title="Baixar arquivo"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)} 
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          {renderPreview()}
        </div>
        
        {/* Informações do arquivo */}
        {file.type !== 'link' && (
          <div className="px-6 pb-4 border-t bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 py-2">
              <div className="flex gap-4">
                <span>Tipo: {file.extension?.toUpperCase() || file.mimeType?.split('/')[1]?.toUpperCase() || 'Desconhecido'}</span>
                {file.size && <span>Tamanho: {file.size}</span>}
                <span>Modificado: {file.modified}</span>
              </div>
              {file.owner && (
                <span>Proprietário: {file.owner.name || file.owner.nome}</span>
              )}
            </div>
            
            {/* Informações de permissões */}
            <div className="flex gap-2 mt-2">
              {!file.allowDownload && (
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded">
                  Download restrito
                </span>
              )}
              
              {file.departamentoVisibilidade && 
               !file.departamentoVisibilidade.includes('TODOS') && (
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs rounded">
                  Visibilidade: {file.departamentoVisibilidade.join(', ')}
                </span>
              )}
              
              {file.isPublic && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs rounded">
                  Público
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Informações para links */}
        {file.type === 'link' && file.linkUrl && (
          <div className="px-6 pb-4 border-t bg-gray-50 dark:bg-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 py-2">
              <p className="font-medium mb-1">URL do Link:</p>
              <p className="break-all text-blue-600 dark:text-blue-400">{file.linkUrl}</p>
              {file.description && (
                <>
                  <p className="font-medium mt-2 mb-1">Descrição:</p>
                  <p>{file.description}</p>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};