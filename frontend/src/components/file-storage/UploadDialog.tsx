// src/components/file-storage/UploadDialog.tsx - Versão melhorada
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, File, X, Link, FileText } from "lucide-react";
import { useFiles } from "@/contexts/FileContext";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

import DepartamentoSelector from "@/components/timeline/DepartamentoSelector";

export const UploadDialog = ({ isOpen, onOpenChange }: UploadDialogProps) => {
  const { uploadFile, isLoading } = useFiles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados comuns
  const [description, setDescription] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['TODOS']);
  const [allowDownload, setAllowDownload] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("file");
  
  // Estados para arquivo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Estados para link
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  
  // Manipuladores de arquivo
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

  // Manipuladores de departamentos - usando o componente centralizado
  const handleDepartmentChange = (departments: string[]) => {
    setSelectedDepartments(departments);
  };
  
  // Validar URL
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  // Upload de arquivo
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      await uploadFile(selectedFile, {
        description,
        departamentoVisibilidade: selectedDepartments,
        allowDownload,
        type: 'file'
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 500);
    } catch (error) {
      setProgress(0);
    }
  };
  
  // Criar link
  const handleLinkCreate = async () => {
    if (!linkName.trim() || !linkUrl.trim() || !isValidUrl(linkUrl)) return;
    
    try {
      await uploadFile(null, {
        description,
        departamentoVisibilidade: selectedDepartments,
        allowDownload: false,
        type: 'link',
        linkName: linkName.trim(),
        linkUrl: linkUrl.trim()
      });
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar link:', error);
    }
  };
  
  // Resetar formulário
  const resetForm = () => {
    setSelectedFile(null);
    setDescription("");
    setSelectedDepartments(['TODOS']);
    setAllowDownload(true);
    setProgress(0);
    setIsDragging(false);
    setLinkName("");
    setLinkUrl("");
    setActiveTab("file");
  };
  
  // Fechar dialog
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };
  
  // Verificar se pode submeter
  const canSubmitFile = selectedFile && !isLoading && progress === 0;
  const canSubmitLink = linkName.trim() && linkUrl.trim() && isValidUrl(linkUrl) && !isLoading;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Item</DialogTitle>
          <DialogDescription>
            Envie um arquivo ou adicione um link para compartilhar com sua equipe.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Enviar Arquivo
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Adicionar Link
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="space-y-4 mt-4">
            {progress > 0 ? (
              <Card>
                <CardContent className="pt-6">
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
                </CardContent>
              </Card>
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
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-name">Nome do Link *</Label>
                <Input
                  id="link-name"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder="Ex: Site da empresa, Documentação, etc."
                  className="focus-visible:ring-[#e60909]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="link-url">URL do Link *</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://exemplo.com"
                  className="focus-visible:ring-[#e60909]"
                />
                {linkUrl && !isValidUrl(linkUrl) && (
                  <p className="text-sm text-red-500">URL inválida</p>
                )}
              </div>
              
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-2">
                    <Link className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Sobre os Links
                      </p>
                      <p className="text-sm text-blue-700">
                        Links são úteis para compartilhar recursos externos, documentos online, 
                        sites importantes ou qualquer conteúdo web relevante para a equipe.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Configurações Comuns */}
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione uma descrição para ajudar outros usuários a entender o conteúdo"
              className="focus-visible:ring-[#e60909]"
              rows={3}
            />
          </div>
          
          <div className="space-y-3">
            <DepartamentoSelector 
              onChange={handleDepartmentChange}
              initialSelected={selectedDepartments}
              showLabel={true}
              compact={false}
            />
            <p className="text-xs text-gray-500">
              Selecione quais departamentos podem ver este item
            </p>
          </div>
          
          {activeTab === "file" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-download"
                checked={allowDownload}
                onCheckedChange={setAllowDownload}
              />
              <Label htmlFor="allow-download" className="text-sm">
                Permitir download deste arquivo
              </Label>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          
          {activeTab === "file" ? (
            <Button 
              className="bg-[#e60909] hover:bg-[#e60909]/90 text-white font-medium"
              onClick={handleFileUpload}
              disabled={!canSubmitFile}
            >
              {isLoading ? "Enviando..." : "Enviar Arquivo"}
            </Button>
          ) : (
            <Button 
              className="bg-[#e60909] hover:bg-[#e60909]/90 text-white font-medium"
              onClick={handleLinkCreate}
              disabled={!canSubmitLink}
            >
              {isLoading ? "Criando..." : "Criar Link"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};