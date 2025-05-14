// src/components/file-storage/NewFolderDialog.tsx
import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { useFiles } from "@/contexts/FileContext";

interface NewFolderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewFolderDialog = ({ isOpen, onOpenChange }: NewFolderDialogProps) => {
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { createNewFolder } = useFiles();
  
  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    
    setIsLoading(true);
    try {
      await createNewFolder(folderName, folderDescription, coverImage);
      setFolderName("");
      setFolderDescription("");
      setCoverImage(null);
      setCoverPreview(null);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFolderName("");
      setFolderDescription("");
      setCoverImage(null);
      setCoverPreview(null);
    }
    onOpenChange(open);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Pasta</DialogTitle>
          <DialogDescription>
            Digite o nome, descrição e adicione uma capa para a nova pasta.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Nome da pasta *</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Digite o nome da pasta"
              className="focus-visible:ring-[#e60909]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="folder-description">Descrição (opcional)</Label>
            <Textarea
              id="folder-description"
              value={folderDescription}
              onChange={(e) => setFolderDescription(e.target.value)}
              placeholder="Digite uma breve descrição da pasta"
              className="focus-visible:ring-[#e60909]"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Capa da pasta (opcional)</Label>
            <div 
              className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                transition-all duration-200 hover:border-[#e60909] hover:bg-[#e60909]/5
                ${coverPreview ? 'border-[#e60909] bg-[#e60909]/5' : 'border-gray-300'}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="hidden"
              />
              
              {coverPreview ? (
                <div className="relative">
                  <div className="aspect-video w-full overflow-hidden rounded-lg">
                    <img 
                      src={coverPreview} 
                      alt="Capa da pasta" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCoverImage();
                    }}
                  >
                    Remover imagem
                  </Button>
                </div>
              ) : (
                <div className="py-6">
                  <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Clique para adicionar uma imagem de capa
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG ou GIF (máx. 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateFolder}
            disabled={!folderName.trim() || isLoading}
            className="bg-[#e60909] hover:bg-[#e60909]/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Pasta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};