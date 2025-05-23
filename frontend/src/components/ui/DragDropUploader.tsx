// src/components/ui/DragDropUploader.tsx
import { useState } from "react";
import { Upload, X, FileText, Image, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DragDropUploaderProps {
  onFileSelect: (file: File | null) => void;
  acceptedTypes: string;
  maxSize?: number; // em MB
  fileType: 'image' | 'document' | 'video';
  selectedFile?: File | null;
  preview?: string | null;
  className?: string;
}

export function DragDropUploader({
  onFileSelect,
  acceptedTypes,
  maxSize = 100,
  fileType,
  selectedFile,
  preview,
  className
}: DragDropUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      validateAndSelectFile(file);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
    // Reset input value para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };
  
  const validateAndSelectFile = (file: File) => {
    // Verificar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`);
      return;
    }
    
    // Verificar tipo
    const validTypes = {
      'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'video': ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov']
    };
    
    const acceptedMimeTypes = validTypes[fileType] || [];
    
    if (!acceptedMimeTypes.includes(file.type)) {
      alert(`Tipo de arquivo não suportado para ${fileType}`);
      return;
    }
    
    onFileSelect(file);
  };
  
  const removeFile = () => {
    onFileSelect(null);
  };
  
  const getIcon = () => {
    switch (fileType) {
      case 'image':
        return <Image className="h-12 w-12 text-gray-400" />;
      case 'document':
        return <FileText className="h-12 w-12 text-gray-400" />;
      case 'video':
        return <Film className="h-12 w-12 text-gray-400" />;
      default:
        return <Upload className="h-12 w-12 text-gray-400" />;
    }
  };
  
  const getAcceptedFormats = () => {
    switch (fileType) {
      case 'image':
        return 'JPG, PNG, GIF, WEBP';
      case 'document':
        return 'PDF, DOC, DOCX';
      case 'video':
        return 'MP4, WEBM, OGG, AVI, MOV';
      default:
        return 'Arquivos suportados';
    }
  };
  
  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
        dragOver ? "border-blue-500 bg-blue-50 scale-105" : "border-gray-300",
        selectedFile ? "border-green-500 bg-green-50" : "",
        "hover:border-gray-400 hover:bg-gray-50",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {selectedFile ? (
        <div className="space-y-4">
          {/* Preview da imagem */}
          {preview && fileType === 'image' ? (
            <div className="relative">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-48 mx-auto rounded-lg shadow-md object-cover"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 rounded-full h-8 w-8 p-0"
                onClick={removeFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            /* Ícone para outros tipos de arquivo */
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                {getIcon()}
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 rounded-full h-6 w-6 p-0"
                  onClick={removeFile}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-green-600">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm text-green-600 font-medium">
              Arquivo selecionado
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-center space-y-3">
            {dragOver ? (
              <div className="animate-bounce">
                <Upload className="h-16 w-16 text-blue-500" />
              </div>
            ) : (
              getIcon()
            )}
            
            <div className="space-y-2">
              <p className="text-gray-600">
                {dragOver ? (
                  <span className="text-blue-600 font-medium">
                    Solte o arquivo aqui
                  </span>
                ) : (
                  <>
                    Arraste e solte o arquivo aqui ou{' '}
                    <label className="text-blue-600 hover:text-blue-500 cursor-pointer font-medium transition-colors">
                      clique para selecionar
                      <input
                        type="file"
                        className="sr-only"
                        onChange={handleFileInputChange}
                        accept={acceptedTypes}
                      />
                    </label>
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500">
                {getAcceptedFormats()} até {maxSize}MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}