//src/components/file-storage/UploadDialog.tsx
import React, { useRef, useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
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
    }
    onOpenChange(open);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
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
                  <File className="h-4 w-4 mr-2 text-supernosso-red" />
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
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                selectedFile ? 'border-supernosso-green bg-supernosso-green/5' : 'border-gray-300 hover:border-supernosso-green'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <Upload className={`h-12 w-12 mx-auto mb-4 ${selectedFile ? 'text-supernosso-green' : 'text-gray-400'}`} />
              <div className="text-sm text-gray-600">
                {selectedFile 
                  ? `Arquivo selecionado: ${selectedFile.name}` 
                  : "Arraste e solte arquivos aqui ou clique para selecionar"}
              </div>
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
			className="bg-supernosso-green hover:bg-supernosso-green/90 text-white font-medium"
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