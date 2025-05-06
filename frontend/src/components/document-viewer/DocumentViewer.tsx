// src/components/document-viewer/DocumentViewer.tsx
import { useState, useEffect } from 'react';
import { FileItem } from '@/contexts/FileContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, ExternalLink, AlertTriangle, Copy } from 'lucide-react';
import { fileService } from '@/services/fileService';

interface DocumentViewerProps {
  file: FileItem | null;
  onClose: () => void;
  onDownload?: (fileId: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  file,
  onClose,
  onDownload
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [textContent, setTextContent] = useState<string | null>(null);
  
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setIsLoading(false);
      return;
    }
    
    const fetchPreview = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Verificar se é um tipo de arquivo que pode ser visualizado
        const canPreview = fileService.canPreviewFile(file.mimeType, file.extension);
        
        if (!canPreview) {
          setError('Este tipo de arquivo não pode ser visualizado diretamente.');
          setIsLoading(false);
          return;
        }
        
        // Obter URL para visualização
        const url = fileService.getFilePreviewUrl(file.id);
        setPreviewUrl(url);
        
        // Para arquivos de texto, também carregar o conteúdo como texto
        if (file.mimeType?.includes('text/') || 
            ['txt', 'md', 'json', 'csv', 'xml', 'html', 'css', 'js'].includes(file.extension || '')) {
          try {
            const response = await fetch(url);
            const text = await response.text();
            setTextContent(text);
          } catch (textError) {
            console.error('Erro ao carregar conteúdo de texto:', textError);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar visualização:', error);
        setError('Não foi possível carregar a visualização deste arquivo.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPreview();
    
    // Cleanup
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file]);
  
  // Função para lidar com o download
  const handleDownload = () => {
    if (file && onDownload) {
      onDownload(file.id);
    } else if (file) {
      fileService.downloadFile(file.id, file.originalName);
    }
  };
  
  // Função para copiar o conteúdo
  const handleCopyContent = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent)
        .then(() => {
          // Poderia mostrar um toast de sucesso aqui
          console.log('Conteúdo copiado para a área de transferência');
        })
        .catch(err => {
          console.error('Erro ao copiar conteúdo:', err);
        });
    }
  };
  
  // Renderizar com base no tipo de arquivo
  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      );
    }
    
    if (error || !previewUrl || !file) {
      return (
        <div className="flex items-center justify-center h-full flex-col">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <p className="text-center text-gray-700 dark:text-gray-300 mb-2">
            {error || 'Não foi possível carregar a visualização.'}
          </p>
          {file && (
            <Button 
              onClick={handleDownload}
              className="mt-4"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Arquivo
            </Button>
          )}
        </div>
      );
    }
    
    // Exibir com base no tipo de arquivo
    if (file.mimeType?.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full p-4 overflow-auto">
          <img 
            src={previewUrl} 
            alt={file.name} 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }
    
    if (file.mimeType === 'application/pdf') {
      return (
        <div className="h-full">
          <iframe 
            src={`${previewUrl}#toolbar=0`} 
            className="w-full h-full border-0"
            title={file.name}
          />
        </div>
      );
    }
    
    if (file.mimeType?.startsWith('text/') || 
        ['txt', 'md', 'json', 'csv', 'xml', 'html', 'css', 'js'].includes(file.extension || '')) {
      return (
        <div className="h-full p-4 overflow-auto">
          <pre className="text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
            {textContent || 'Conteúdo não disponível'}
          </pre>
        </div>
      );
    }
    
    if (file.mimeType?.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center h-full">
          <video 
            src={previewUrl} 
            controls 
            className="max-w-full max-h-full"
          >
            Seu navegador não suporta a tag de vídeo.
          </video>
        </div>
      );
    }
    
    if (file.mimeType?.startsWith('audio/')) {
      return (
        <div className="flex items-center justify-center h-full">
          <audio 
            src={previewUrl} 
            controls 
            className="w-full max-w-md"
          >
            Seu navegador não suporta a tag de áudio.
          </audio>
        </div>
      );
    }
    
    // Fallback para qualquer outro tipo
    return (
      <div className="flex items-center justify-center h-full flex-col">
        <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
          Visualização não disponível para este tipo de arquivo.
        </p>
        <Button 
          onClick={handleDownload}
          variant="outline"
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar Arquivo
        </Button>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium truncate mr-4">
          {file ? file.name : 'Visualizador de Documentos'}
        </h3>
        
        <div className="flex space-x-2">
          {file && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              
              {textContent && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyContent}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="flex-1 overflow-hidden">
        {file && file.mimeType?.startsWith('text/') ? (
          <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b px-4">
              <TabsList>
                <TabsTrigger value="preview">Visualização</TabsTrigger>
                <TabsTrigger value="raw">Texto Bruto</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="preview" className="flex-1 overflow-auto p-0 m-0">
              {renderPreview()}
            </TabsContent>
            
            <TabsContent value="raw" className="flex-1 overflow-auto p-4 m-0">
              <pre className="text-sm whitespace-pre-wrap">{textContent || 'Conteúdo não disponível'}</pre>
            </TabsContent>
          </Tabs>
        ) : (
          renderPreview()
        )}
      </div>
    </div>
  );
};