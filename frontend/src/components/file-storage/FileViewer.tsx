//src/components/file-storage/FileViewer.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { FilePreview } from '@/contexts/FileContext';
import { fileService } from '@/services/fileService';

interface FileViewerProps {
  filePreview: FilePreview | null;
  onClose: () => void;
  onDownload: (fileId: string) => Promise<void>;
}

export const FileViewer: React.FC<FileViewerProps> = ({ 
  filePreview, 
  onClose,
  onDownload
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Manipulador para fazer download
  const handleDownload = async () => {
    if (!filePreview) return;
    
    setIsLoading(true);
    try {
      await onDownload(filePreview.fileId);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      setLoadError(error instanceof Error ? error.message : 'Erro ao baixar arquivo');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Abrir em nova aba
  const handleOpenInNewTab = () => {
    if (!filePreview) return;
    window.open(filePreview.previewUrl, '_blank');
  };
  
  // Não exibir nada se não houver arquivo para visualizar
  if (!filePreview) return null;
  
  // Determinar o tipo de visualização com base no tipo do arquivo
  const renderPreview = () => {
    const fileType = filePreview.fileType.toLowerCase();
    
    // Se não puder visualizar, mostrar mensagem
    if (!filePreview.canPreview) {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50">
          <FileText size={48} className="text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Este arquivo não pode ser visualizado</h3>
          <p className="text-gray-500 text-sm mb-4">
            Você precisa baixar este arquivo para visualizá-lo.
          </p>
          <Button onClick={handleDownload} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            {isLoading ? 'Baixando...' : 'Baixar arquivo'}
          </Button>
        </div>
      );
    }
    
    // Imagens
    if (fileType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-[70vh] bg-gray-50">
          <img 
            src={filePreview.previewUrl} 
            alt={filePreview.fileName} 
            className="max-h-full max-w-full object-contain" 
            onError={() => setLoadError('Erro ao carregar imagem')}
          />
        </div>
      );
    }
    
    // PDF
    if (fileType === 'application/pdf') {
      return (
        <div className="h-[70vh]">
          <iframe 
            src={filePreview.previewUrl} 
            title={filePreview.fileName}
            className="w-full h-full"
            onError={() => setLoadError('Erro ao carregar PDF')}
          />
        </div>
      );
    }
    
    // Vídeos
    if (fileType.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center h-[70vh] bg-black">
          <video 
            src={filePreview.previewUrl}
            controls
            className="max-h-full max-w-full"
            onError={() => setLoadError('Erro ao carregar vídeo')}
          >
            Seu navegador não suporta a reprodução deste vídeo.
          </video>
        </div>
      );
    }
    
    // Áudio
    if (fileType.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50">
          <div className="w-full max-w-md bg-white p-4 rounded-lg shadow">
            <h3 className="text-center font-medium mb-4">{filePreview.fileName}</h3>
            <audio 
              src={filePreview.previewUrl}
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
    
    // Arquivo de texto
    if (fileType.startsWith('text/') || 
        fileType === 'application/json' || 
        fileType === 'application/xml') {
      return (
        <div className="h-[70vh] overflow-auto bg-gray-50">
          <iframe 
            src={filePreview.previewUrl}
            title={filePreview.fileName}
            className="w-full h-full border-0"
            onError={() => setLoadError('Erro ao carregar texto')}
          />
        </div>
      );
    }
    
    // Arquivos não suportados diretamente
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50">
        <FileText size={48} className="text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Visualização não disponível</h3>
        <p className="text-gray-500 text-sm mb-4">
          Este tipo de arquivo não pode ser visualizado diretamente no navegador.
        </p>
        <div className="flex gap-2">
          <Button onClick={handleDownload} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            {isLoading ? 'Baixando...' : 'Baixar arquivo'}
          </Button>
          <Button variant="outline" onClick={handleOpenInNewTab}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir em nova aba
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <Dialog open={!!filePreview} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[80vw] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <DialogTitle className="font-medium text-lg">{filePreview.fileName}</DialogTitle>
              <DialogDescription>
                {fileService.canPreviewFile(filePreview.fileType) 
                  ? 'Visualização do arquivo' 
                  : 'Este arquivo não pode ser visualizado diretamente'}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleOpenInNewTab} title="Abrir em nova aba">
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleDownload} title="Baixar">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} title="Fechar">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-6">
          {loadError ? (
            <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50">
              <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Erro ao carregar arquivo</h3>
                <p>{loadError}</p>
              </div>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Tentar baixar o arquivo
              </Button>
            </div>
          ) : (
            renderPreview()
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};