//src/components/file-storage/FileHeader.tsx
import React, { useState } from "react";
import { Search, Upload, Plus, RotateCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFiles } from "@/contexts/FileContext";
import { NewFolderDialog } from "./NewFolderDialog";
import { UploadDialog } from "./UploadDialog";
import { usePermission } from "@/hooks/usePermission";


export const FileHeader = () => {
  const { searchQuery, setSearchQuery, refreshFiles, isLoading } = useFiles();
  const { hasPermission } = usePermission();
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold ml-6">Arquivos</h1>
        <p className="text-muted-foreground ml-6">Armazene e gerencie seus documentos</p>
      </div>
      
      <div className="flex gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar arquivos..." 
            value={searchQuery}
            onChange={handleSearch}
            className="pl-8 focus-visible:ring-supernosso-red w-full"
          />
        </div>
        
        <Button 
          variant="ghost"
          size="icon"
          onClick={refreshFiles}
          disabled={isLoading}
          className="flex-shrink-0"
          title="Atualizar"
        >
          <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        
        {hasPermission('files:upload') && (
		<Button 
		  className="bg-[#870f0b] hover:bg-[#870f0b]/90 text-white flex-shrink-0"
		  onClick={() => setIsUploadDialogOpen(true)}
		>
		  <Upload className="h-4 w-4 mr-2" />
		  Enviar Arquivo
		</Button>
	  )}
        
        <UploadDialog 
          isOpen={isUploadDialogOpen} 
          onOpenChange={setIsUploadDialogOpen} 
        />
        
         {hasPermission('files:create_folder') && (
		<Button 
		  variant="outline"
		  onClick={() => setIsNewFolderDialogOpen(true)}
		  className="flex-shrink-0"
		>
		  <Plus className="h-4 w-4 mr-2" />
		  Nova Pasta
		</Button>
	  )}
        
        <NewFolderDialog 
          isOpen={isNewFolderDialogOpen} 
          onOpenChange={setIsNewFolderDialogOpen} 
        />
      </div>
    </div>
  );
};