// src/components/file-storage/FileViewer.tsx - Integrado com FileService
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { FileItem } from '@/contexts/FileContext';
import { fileService } from '@/services/fileService';

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
  
  // Manipulador para fazer download usando o fileService
  const handleDownload = async () => {
    if (!file || !file.allowDownload) return;
    
    setIsLoading(true);
    try {
      if (onDownload) {
        await onDownload(file.id);
      } else {
        // Usar fileService diretamente
        await fileService.downloadFile(file.id, file.originalName || file.name);
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
    
    // Para links, abrir a URL diretamente
    if (file.type === 'link' && file.linkUrl) {
      window.open(file.linkUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // Para arquivos, abrir a URL de preview
    try {
      const previewUrl = fileService.getFilePreviewUrl(file.id);
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Erro ao abrir preview:', error);
      setLoadError('Não foi possível abrir o arquivo em nova aba');
    }
  };
  
  // Verificar capacidades de preview usando fileService
  const getPreviewCapability = () => {
    if (!file || file.type === 'link') return { canPreview: false, previewType: 'none' as const };
    
    return fileService.getPreviewCapability(file.mimeType || '', file.extension);
  };
  
  // Não exibir nada se não houver arquivo para visualizar
  if (!file) return null;
  
  const previewCapability = getPreviewCapability();
  
  // Renderizar preview baseado no tipo
  const renderPreview = () => {
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
    
    // Se não puder fazer preview
    if (!previewCapability.canPreview) {
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
            <Button variant="outline" onClick={handleOpenInNewTab}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Tentar abrir
            </Button>
          </div>
          {!file.allowDownload && (
            <p className="text-red-500 text-xs mt-2">Download não permitido para este arquivo</p>
          )}
        </div>
      );
    }
    
    // Obter URL de preview usando fileService
    const previewUrl = fileService.getFilePreviewUrl(file.id);
    
    // Renderizar baseado no tipo de preview
    switch (previewCapability.previewType) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-[70vh] bg-gray-50 dark:bg-gray-900">
            <img 
              src={previewUrl} 
              alt={file.name} 
              className="max-h-full max-w-full object-contain" 
              onError={() => setLoadError('Erro ao carregar imagem')}
              onLoad={() => setLoadError(null)}
            />
          </div>
        );
      
      case 'pdf':
        return (
          <div className="h-[70vh]">
            <iframe 
              src={previewUrl} 
              title={file.name}
              className="w-full h-full border-0"
              onError={() => setLoadError('Erro ao carregar PDF')}
              onLoad={() => setLoadError(null)}
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="flex items-center justify-center h-[70vh] bg-black">
            <video 
              src={previewUrl}
              controls
              className="max-h-full max-w-full"
              onError={() => setLoadError('Erro ao carregar vídeo')}
              onLoadStart={() => setLoadError(null)}
            >
              Seu navegador não suporta a reprodução deste vídeo.
            </video>
          </div>
        );
      
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-center font-medium mb-4 text-gray-900 dark:text-gray-100">
                {file.name}
              </h3>
              <audio 
                src={previewUrl}
                controls
                className="w-full"
                onError={() => setLoadError('Erro ao carregar áudio')}
                onLoadStart={() => setLoadError(null)}
              >
                Seu navegador não suporta a reprodução deste áudio.
              </audio>
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div className="h-[70vh] overflow-auto bg-gray-50 dark:bg-gray-900">
            <iframe 
              src={previewUrl}
              title={file.name}
              className="w-full h-full border-0"
              onError={() => setLoadError('Erro ao carregar texto')}
              onLoad={() => setLoadError(null)}
            />
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50 dark:bg-gray-900">
            <FileText size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Visualização não disponível</h3>
            <p className="text-gray-500 text-sm mb-4">
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
              <Button variant="outline" onClick={handleOpenInNewTab}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir em nova aba
              </Button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
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
          {loadError ? (
            <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50 dark:bg-gray-900">
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg max-w-md text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-medium mb-2">Erro ao carregar</h3>
                <p className="text-sm">{loadError}</p>
              </div>
              <div className="flex gap-2 mt-4">
                {file.allowDownload && (
                  <Button 
                    variant="outline" 
                    onClick={handleDownload}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Baixando...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Tentar baixar o arquivo
                      </>
                    )}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setLoadError(null)}
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : (
            renderPreview()
          )}
        </div>
        
        {/* Informações adicionais do arquivo */}
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