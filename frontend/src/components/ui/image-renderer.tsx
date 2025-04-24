// src/components/ui/image-renderer.tsx
import React, { useState, useEffect } from 'react';
import { ImageModal } from './image-modal';

interface ImageRendererProps {
  src: string;
  alt: string;
  className?: string;
  enableModal?: boolean;
}

export const ImageRenderer: React.FC<ImageRendererProps> = ({ 
  src, 
  alt, 
  className = "", 
  enableModal = true 
}) => {
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setError(false);
    setAttemptCount(0);
    setLoading(true);
    
    if (src) {
      // Usar o caminho original inicialmente
      setCurrentSrc(src);
    }
  }, [src]);
  
  const handleError = () => {
    console.log(`Erro ao carregar imagem [Tentativa ${attemptCount + 1}]: ${currentSrc}`);
    
    // Se ainda temos tentativas disponíveis
    if (attemptCount < 4) {
      const nextAttempt = attemptCount + 1;
      setAttemptCount(nextAttempt);
      
      let newSrc = '';
      
      switch (nextAttempt) {
        case 1:
          // Extrair apenas o nome do arquivo e tentar com /api/arquivo/
          const filename1 = src.split('/').pop();
          newSrc = filename1 ? `/api/arquivo/${filename1}` : src;
          break;
        case 2:
          // Tentar caminho direto em /uploads/timeline/
          const filename2 = src.split('/').pop();
          newSrc = filename2 ? `/uploads/timeline/${filename2}` : src;
          break;
        case 3:
          // Tentar caminho direto em /uploads/
          const filename3 = src.split('/').pop();
          newSrc = filename3 ? `/uploads/${filename3}` : src;
          break;
        case 4:
          // Última tentativa - caminho absoluto
          const filename4 = src.split('/').pop();
          const baseUrl = window.location.origin;
          newSrc = filename4 ? `${baseUrl}/uploads/timeline/${filename4}` : src;
          break;
      }
      
      console.log(`Tentativa ${nextAttempt}: Tentando novo caminho: ${newSrc}`);
      setCurrentSrc(newSrc);
    } else {
      // Esgotar tentativas
      console.error('Todas as tentativas falharam para imagem:', src);
      setError(true);
      setLoading(false);
    }
  };
  
  const handleLoad = () => {
    console.log(`Imagem carregada com sucesso: ${currentSrc}`);
    setLoading(false);
  };
  
  const imageContent = (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        </div>
      )}
      <img 
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover ${loading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );

  if (error) {
    return (
      <div className={`relative ${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center p-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-10 w-10 mx-auto text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <p className="mt-2 text-xs text-gray-500">Não foi possível carregar a imagem</p>
        </div>
      </div>
    );
  }

  // Se o modal estiver habilitado e não estiver com erro, envolva a imagem com o componente ImageModal
  if (enableModal) {
    return (
      <ImageModal src={currentSrc} alt={alt}>
        {imageContent}
      </ImageModal>
    );
  }

  // Caso contrário, retorne apenas a imagem
  return imageContent;
};

export default ImageRenderer;