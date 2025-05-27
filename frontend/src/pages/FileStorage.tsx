// src/pages/FileStorage.tsx (Versão corrigida com componentes modulares)
import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileProvider, useFiles } from "@/contexts/FileContext";
import { FileHeader } from "@/components/file-storage/FileHeader";
import { FileItemComponent } from "@/components/file-storage/FileItem";
import { FileViewer } from "@/components/file-storage/FileViewer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileGrid } from "@/components/file-storage/FileGrid"; // Adicionar esta importação
import { 
  ChevronRight, 
  Home,
  AlertCircle,
  Loader2,
  CornerUpLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

// Mantenha o FileBreadcrumb como está (ou mova para arquivo separado)
const FileBreadcrumb: React.FC = () => {
  const { currentPath, navigateToBreadcrumb } = useFiles();
  
  return (
    <div className="flex items-center text-sm text-gray-500 overflow-x-auto pb-2">
      {currentPath.map((path, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />}
          <button
            className={`hover:text-gray-900 whitespace-nowrap ${
              index === currentPath.length - 1 ? "font-medium text-gray-900" : ""
            }`}
            onClick={() => navigateToBreadcrumb(index)}
          >
            {index === 0 ? (
              <div className="flex items-center">
                <Home className="h-4 w-4 mr-1" />
                <span>{path}</span>
				<CornerUpLeft className="h-4 w-4 ml-1" />
              </div>
            ) : (
              path
            )}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};


// Wrapper para o componente de visualização de arquivo
const FileViewerWrapper: React.FC = () => {
  const { previewFile, closeFilePreview, downloadFile } = useFiles();
  
  // Converter previewFile para o formato esperado
  const fileForViewer = previewFile ? {
    id: previewFile.fileId,
    name: previewFile.fileName,
    type: 'file' as const,
    mimeType: previewFile.fileType,
    allowDownload: true,
    // ... outros campos necessários
  } : null;
  
  return (
    <FileViewer 
      file={fileForViewer} // CORREÇÃO: usar file em vez de filePreview
      isOpen={!!previewFile} // CORREÇÃO: usar isOpen
      onOpenChange={(open) => !open && closeFilePreview()} // CORREÇÃO: usar onOpenChange
      onDownload={(fileId) => downloadFile(fileId)}
    />
  );
};

// Componente principal - VERSÃO CORRIGIDA
const FileStorage: React.FC = () => {
  return (
    <Layout>
      <FileProvider>
        <div className="space-y-6">
          <FileHeader />  {/* Usando o FileHeader modular que importa NewFolderDialog */}
          
          <Card>
            <CardHeader className="pb-3">
              <FileBreadcrumb />
            </CardHeader>
            <CardContent>
              <FileGrid />
            </CardContent>
          </Card>
          
          <FileViewerWrapper />
        </div>
      </FileProvider>
    </Layout>
  );
};

export default FileStorage;