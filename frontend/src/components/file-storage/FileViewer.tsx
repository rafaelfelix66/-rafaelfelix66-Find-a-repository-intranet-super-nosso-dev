//src/components/file-storage/FileViewer.tsx
import React from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Eye, File } from "lucide-react";
import { FileItem } from "@/contexts/FileContext";
import { cn } from "@/lib/utils";
import { getBaseUrl } from "@/services/api";
import { FileIcon } from "./FileIcon";

interface FileViewerProps {
  file: FileItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
}

export const FileViewer = ({ file, isOpen, onOpenChange, onDownload }: FileViewerProps) => {
  // Garantir que o arquivo tenha um ícone
  const fileIcon = file.icon || <FileIcon type="file" extension={file.extension} />;
  
  // Determinar a URL de visualização para o arquivo
  const getFilePreviewUrl = () => {
    if (!file.path) return null;
    
    // Para arquivos relativos, adicionar o URL base
    if (file.path.startsWith('/')) {
      return `${getBaseUrl()}${file.path}`;
    }
    
    return file.path;
  };
  
  // Determinar preview content based on file extension
  const renderPreview = () => {
    const extension = file.extension?.toLowerCase();
    const previewUrl = getFilePreviewUrl();
    
    // Renderizar preview específico por tipo de arquivo
    switch(extension) {
      case 'pdf':
        return (
          <div className="bg-red-50 rounded-lg p-10 text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center bg-red-100 rounded-full mb-4">
              {fileIcon}
            </div>
            <h3 className="text-lg font-semibold mb-2">Documento PDF</h3>
            <p className="text-sm text-gray-500 mb-4">
              {previewUrl ? (
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => window.open(previewUrl, '_blank')}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar PDF
                </Button>
              ) : (
                "Visualização indisponível. Clique em baixar para ver o arquivo."
              )}
            </p>
          </div>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return previewUrl ? (
          <div className="text-center">
            <img 
              src={previewUrl} 
              alt={file.name} 
              className="max-h-96 mx-auto rounded-lg object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
                target.onerror = null;
              }}
            />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-10 text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mb-4">
              {fileIcon}
            </div>
            <h3 className="text-lg font-semibold mb-2">Imagem {extension?.toUpperCase()}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Visualização indisponível. Clique em baixar para ver a imagem.
            </p>
          </div>
        );
      case 'docx':
      case 'doc':
        return (
          <div className="bg-blue-50 rounded-lg p-10 text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center bg-blue-100 rounded-full mb-4">
              {fileIcon}
            </div>
            <h3 className="text-lg font-semibold mb-2">Documento Word</h3>
            <p className="text-sm text-gray-500 mb-4">
              Visualização indisponível. Clique em baixar para ver o arquivo.
            </p>
          </div>
        );
      case 'xlsx':
      case 'xls':
        return (
          <div className="bg-green-50 rounded-lg p-10 text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center bg-green-100 rounded-full mb-4">
              {fileIcon}
            </div>
            <h3 className="text-lg font-semibold mb-2">Planilha Excel</h3>
            <p className="text-sm text-gray-500 mb-4">
              Visualização indisponível. Clique em baixar para ver o arquivo.
            </p>
          </div>
        );
      case 'pptx':
      case 'ppt':
        return (
          <div className="bg-orange-50 rounded-lg p-10 text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center bg-orange-100 rounded-full mb-4">
              {fileIcon}
            </div>
            <h3 className="text-lg font-semibold mb-2">Apresentação PowerPoint</h3>
            <p className="text-sm text-gray-500 mb-4">
              Visualização indisponível. Clique em baixar para ver o arquivo.
            </p>
          </div>
        );
      default:
        return (
          <div className="bg-gray-50 rounded-lg p-10 text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mb-4">
              <File className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Arquivo {extension ? extension.toUpperCase() : "Desconhecido"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Visualização não disponível para este tipo de arquivo.
            </p>
          </div>
        );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="line-clamp-1">{file.name}</span>
            <span className="text-xs text-gray-500 font-normal">
              {file.size}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 min-h-[300px] flex items-center justify-center">
          {renderPreview()}
        </div>
        
        <DialogFooter>
		  <div className="flex w-full justify-between items-center">
			 <div className="text-xs text-gray-500">
			  Última modificação: {file.modified}
			 </div>
			 <Button onClick={() => {
			  // Construir o nome completo do arquivo
			  const fileName = file.name;
			  const extension = file.extension;
			  const fullFileName = extension ? `${fileName}.${extension}` : fileName;
			  
			  // Chamar download com o nome completo
			  onDownload();
			 }}>
			  <Download className="mr-2 h-4 w-4" />
			  Baixar
			</Button>
		  </div>
		</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};