// src/hooks/use-file-upload.ts

import { useState, useEffect } from 'react';

interface FileUploadOptions {
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
  onFilesSelected?: (files: File[]) => void;
}

interface FileUploadState {
  files: File[];
  previews: string[];
  isLoading: boolean;
  error: string | null;
}

export const useFileUpload = (options: FileUploadOptions = {}) => {
  const {
    maxFiles = 5,
    acceptedTypes = ['image/*', 'video/*'],
    maxSizeInMB = 50,
    onFilesSelected
  } = options;

  const [state, setState] = useState<FileUploadState>({
    files: [],
    previews: [],
    isLoading: false,
    error: null
  });

  // Limpar previews quando o componente desmontar
  useEffect(() => {
    return () => {
      // Revogar as URLs dos previews para evitar vazamentos de memória
      state.previews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [state.previews]);

  const validateFile = (file: File): string | null => {
    // Validar tamanho
    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `O arquivo ${file.name} excede o tamanho máximo de ${maxSizeInMB}MB.`;
    }

    // Validar tipo
    if (acceptedTypes.length > 0) {
      const fileType = file.type;
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          // Para tipos como 'image/*'
          const generalType = type.split('/')[0];
          return fileType.startsWith(`${generalType}/`);
        }
        return type === fileType;
      });

      if (!isAccepted) {
        return `O tipo de arquivo ${file.type} não é aceito.`;
      }
    }

    return null;
  };

  const addFiles = (newFiles: FileList | File[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const filesArray = Array.from(newFiles);

      // Verificar limite de arquivos
      if (state.files.length + filesArray.length > maxFiles) {
        throw new Error(`Você pode selecionar no máximo ${maxFiles} arquivos.`);
      }

      // Validar cada arquivo
      for (const file of filesArray) {
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(validationError);
        }
      }

      // Criar previews para os novos arquivos
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));

      // Atualizar estado
      const updatedFiles = [...state.files, ...filesArray];
      const updatedPreviews = [...state.previews, ...newPreviews];

      setState({
        files: updatedFiles,
        previews: updatedPreviews,
        isLoading: false,
        error: null
      });

      // Chamar callback se fornecido
      if (onFilesSelected) {
        onFilesSelected(updatedFiles);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao adicionar arquivos'
      }));
    }
  };

  const removeFile = (index: number) => {
    setState(prev => {
      // Revogar a URL do preview
      if (prev.previews[index]) {
        URL.revokeObjectURL(prev.previews[index]);
      }

      // Remover arquivo e preview do estado
      const updatedFiles = [...prev.files];
      const updatedPreviews = [...prev.previews];
      updatedFiles.splice(index, 1);
      updatedPreviews.splice(index, 1);

      // Chamar callback se fornecido
      if (onFilesSelected) {
        onFilesSelected(updatedFiles);
      }

      return {
        ...prev,
        files: updatedFiles,
        previews: updatedPreviews,
        error: null
      };
    });
  };

  const clearFiles = () => {
    setState(prev => {
      // Revogar as URLs dos previews
      prev.previews.forEach(preview => URL.revokeObjectURL(preview));

      // Chamar callback se fornecido
      if (onFilesSelected) {
        onFilesSelected([]);
      }

      return {
        files: [],
        previews: [],
        isLoading: false,
        error: null
      };
    });
  };

  return {
    files: state.files,
    previews: state.previews,
    isLoading: state.isLoading,
    error: state.error,
    addFiles,
    removeFile,
    clearFiles
  };
};