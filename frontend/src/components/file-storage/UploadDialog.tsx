//src/components/file-storage/UploadDialog.tsx
import React, { useRef, useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, File, X } from "lucide-react";
import { useFiles } from "@/contexts/FileContext";
import { Progress } from "@/components/ui/progress";

interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadDialog = ({ isOpen, onOpenChange }: UploadDialogProps) => {
  const { uploadFile, isLoading } = useFiles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleUpload = async () => {
    if (selectedFile) {
      try {
        // Simulação de progresso (já que não temos progresso real do backend)
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 300);
        
        // Fazer upload
        await uploadFile(selectedFile);
        
        // Finalizar progresso
        clearInterval(progressInterval);
        setProgress(100);
        
        // Limpar
        setTimeout(() => {
          setSelectedFile(null);
          setProgress(0);
          onOpenChange(false);
        }, 500);
      } catch (error) {
        // Em caso de erro, resetar
        setProgress(0);
      }
    }
  };
  
  // Reset when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedFile(null);
      setProgress(0);
      setIsDragging(false);
    }
    onOpenChange(open);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Arquivo</DialogTitle>
          <DialogDescription>
            Selecione um arquivo do seu computador para enviar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {progress > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <File className="h-4 w-4 mr-2 text-[#e60909]" />
                  <span className="font-medium text-sm">
                    {selectedFile?.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <div 
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
                ${isDragging ? 'border-[#e60909] bg-[#e60909]/10 scale-[1.02]' : ''}
                ${selectedFile && !isDragging ? 'border-[#e60909] bg-[#e60909]/5' : ''}
                ${!selectedFile && !isDragging ? 'border-gray-300 hover:border-[#e60909] hover:bg-[#e60909]/5' : ''}
              `}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              {isDragging ? (
                <div>
                  <Upload className="h-16 w-16 mx-auto mb-4 text-[#e60909] animate-pulse" />
                  <div className="text-lg font-medium text-[#e60909]">
                    Solte o arquivo aqui
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    O arquivo será selecionado para upload
                  </div>
                </div>
              ) : selectedFile ? (
                <div>
                  <File className="h-16 w-16 mx-auto mb-4 text-[#e60909]" />
                  <div className="text-lg font-medium text-gray-900">
                    {selectedFile.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover arquivo
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <div className="text-lg font-medium text-gray-900 mb-2">
                    Clique para selecionar um arquivo
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    ou arraste e solte aqui
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#e60909] text-[#e60909] hover:bg-[#e60909] hover:text-white"
                  >
                    Escolher arquivo
                  </Button>
                </div>
              )}
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>
        <DialogFooter className="justify-between">
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            className="bg-[#e60909] hover:bg-[#e60909]/90 text-white font-medium"
            onClick={handleUpload}
            disabled={!selectedFile || isLoading || progress > 0}
          >
            {isLoading ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};