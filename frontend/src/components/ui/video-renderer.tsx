// src/components/ui/video-renderer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Maximize2, X, Download, Volume2, VolumeX } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface VideoRendererProps {
  src: string;
  alt: string;
  className?: string;
  enableModal?: boolean;
  poster?: string;
}

export const VideoRenderer: React.FC<VideoRendererProps> = ({ 
  src, 
  alt, 
  className = "", 
  enableModal = true,
  poster: externalPoster
}) => {
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    setError(false);
    setAttemptCount(0);
    setLoading(true);
    setThumbnail(null);
    setIsPlaying(false);
    
    if (src) {
      // Usar o caminho original inicialmente
      setCurrentSrc(src);
    }
  }, [src]);
  
  // Gerar thumbnail do vídeo a partir de um frame mais adiante (2 segundos)
  useEffect(() => {
    // Se já temos um poster externo, vamos usá-lo
    if (externalPoster) {
      setThumbnail(externalPoster);
      return;
    }

    // Caso contrário, vamos tentar gerar uma thumbnail do próprio vídeo
    const video = hiddenVideoRef.current;
    if (!video || error) return;

    // Função para capturar o frame do vídeo
    const captureVideoFrame = () => {
      try {
        // Avançar para 2 segundos para evitar tela preta
        if (video.duration) {
          // Se o vídeo for menor que 2 segundos, pegue o meio do vídeo
          const seekTime = video.duration < 2 ? video.duration / 2 : 2;
          video.currentTime = seekTime;
        }
      } catch (err) {
        console.error('Erro ao definir currentTime:', err);
        tryCapture(); // Tentar capturar mesmo assim
      }
    };

    // Função para tentar capturar após definir currentTime
    const tryCapture = () => {
      try {
        // Certifique-se de que o vídeo está carregado o suficiente
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA ou superior
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            
            // Verificar se a imagem não é apenas preta
            // Método simples: verificar se há pelo menos alguns pixels não pretos
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imgData.data;
            
            let hasNonBlackPixels = false;
            // Amostragem de pixels para verificar se há conteúdo não preto
            for (let i = 0; i < pixels.length; i += 40) {
              if (pixels[i] > 20 || pixels[i+1] > 20 || pixels[i+2] > 20) {
                hasNonBlackPixels = true;
                break;
              }
            }
            
            if (hasNonBlackPixels) {
              setThumbnail(dataUrl);
              setLoading(false);
            } else if (video.currentTime < video.duration - 1) {
              // Se a imagem for preta e ainda tiver tempo para avançar, tente mais adiante
              video.currentTime += 1;
              // Não atualizar ainda, esperar o próximo 'seeked'
            } else {
              // Se já chegamos ao final e ainda não temos uma boa imagem, use o que temos
              setThumbnail(dataUrl);
              setLoading(false);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao capturar frame do vídeo:', err);
        setLoading(false);
      }
    };

    // Adicionar eventos para capturar o frame
    video.addEventListener('loadeddata', captureVideoFrame);
    video.addEventListener('seeked', tryCapture);
    
    // Se o vídeo já estiver carregado, tente capturar imediatamente
    if (video.readyState >= 2) {
      captureVideoFrame();
    }
    
    return () => {
      if (video) {
        video.removeEventListener('loadeddata', captureVideoFrame);
        video.removeEventListener('seeked', tryCapture);
      }
    };
  }, [currentSrc, error, externalPoster]);
  
  const handleError = () => {
    console.log(`Erro ao carregar vídeo [Tentativa ${attemptCount + 1}]: ${currentSrc}`);
    
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
      
      console.log(`Tentativa ${nextAttempt}: Tentando novo caminho para vídeo: ${newSrc}`);
      setCurrentSrc(newSrc);
    } else {
      // Esgotar tentativas
      console.error('Todas as tentativas falharam para vídeo:', src);
      setError(true);
      setLoading(false);
    }
  };
  
  const handleLoad = () => {
    console.log(`Vídeo carregado com sucesso: ${currentSrc}`);
    setLoading(false);
  };
  
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que o modal abra ao clicar no botão de play
    
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(err => {
        console.warn('Erro ao reproduzir vídeo:', err);
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleVideoStateChange = () => {
    const video = videoRef.current;
    if (!video) return;
    
    setIsPlaying(!video.paused);
  };
  
  // Se o vídeo terminar, voltar para o estado de thumbnail
  const handleVideoEnded = () => {
    setIsPlaying(false);
    // Voltar para o início caso o usuário queira assistir novamente
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };
  
  // Funções do modal
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = currentSrc;
    link.download = alt || 'video';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (modalVideoRef.current) {
      modalVideoRef.current.muted = !modalVideoRef.current.muted;
      setMuted(!muted);
    }
  };

  const toggleModalPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!modalVideoRef.current) return;
    
    if (modalVideoRef.current.paused) {
      modalVideoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.warn('Erro ao reproduzir vídeo no modal:', err));
    } else {
      modalVideoRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  // Quando o modal abrir, iniciar o vídeo
  useEffect(() => {
    if (modalOpen && modalVideoRef.current) {
      const playVideo = async () => {
        try {
          await modalVideoRef.current?.play();
          setIsPlaying(true);
        } catch (err) {
          console.warn('Erro ao reproduzir vídeo no modal:', err);
        }
      };
      
      // Pequeno timeout para garantir que o modal está totalmente aberto
      setTimeout(playVideo, 300);
    }
    
    // Quando o modal fechar, pausar o vídeo
    if (!modalOpen && modalVideoRef.current && !modalVideoRef.current.paused) {
      modalVideoRef.current.pause();
      setIsPlaying(false);
    }
  }, [modalOpen]);
  
  const videoContent = (
    <div 
      className={`relative ${className} group`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        </div>
      )}
      
      {/* Vídeo escondido apenas para gerar thumbnail - não será exibido */}
      <video 
        ref={hiddenVideoRef}
        src={currentSrc}
        className="hidden"
        preload="metadata"
        muted
        playsInline
        onError={handleError}
        onLoadedData={handleLoad}
      />
      
      {/* Vídeo principal para reprodução na timeline */}
      <video 
        ref={videoRef}
        src={currentSrc}
        poster={thumbnail || externalPoster}
        className={`w-full h-full object-cover ${isPlaying ? 'block' : 'hidden'}`}
        playsInline
        preload="auto"
        onError={handleError}
        onPlay={() => handleVideoStateChange()}
        onPause={() => handleVideoStateChange()}
        onEnded={handleVideoEnded}
        onClick={(e) => {
          e.stopPropagation();
          togglePlay(e);
        }}
      />
      
      {/* Thumbnail com ícone de play (visível quando o vídeo não está reproduzindo) */}
      {!isPlaying && (
        <div 
          className="relative w-full h-full"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay(e);
          }}
        >
          {thumbnail && (
            <img 
              src={thumbnail} 
              alt={alt} 
              className={`w-full h-full object-cover ${loading ? 'opacity-0' : 'opacity-100'}`}
            />
          )}
          
          {/* Ícone de play central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="bg-black/30 rounded-full p-3 transform transition-transform duration-200 group-hover:scale-110 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay(e);
              }}
            >
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
        </div>
      )}
      
      {/* Controles de vídeo flutuantes (visíveis no hover) */}
      <div className={`absolute bottom-2 left-0 right-0 px-2 flex items-center justify-between transition-opacity duration-200 ${(showControls || isPlaying) ? 'opacity-100' : 'opacity-0'}`}>
        {/* Botão de play/pause */}
        <button 
          className="bg-black/40 hover:bg-black/60 rounded-full p-2 text-white"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        
        {/* Botão para abrir o modal - SOLUÇÃO DIRETA */}
        {enableModal && (
          <button 
            className="bg-black/40 hover:bg-black/60 rounded-full p-2 text-white"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Abrir o modal diretamente
              setModalOpen(true);
            }}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
      </div>
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
          <p className="mt-2 text-xs text-gray-500">Não foi possível carregar o vídeo</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {videoContent}
      
      {/* Dialog Modal integrado diretamente no componente */}
      {enableModal && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-4xl p-0 bg-transparent border-0 overflow-hidden">
            <div className="relative w-full h-full">
              <div className="absolute top-2 right-2 flex gap-2 z-10">
                <Button 
                  className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white p-0"
                  size="icon"
                  onClick={toggleMute}
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Button 
                  className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white p-0"
                  size="icon"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button 
                  className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white p-0"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalOpen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-center h-full w-full overflow-auto bg-black/90 rounded-lg">
                <div className="p-4 max-h-[90vh] w-full relative group">
                  <video
                    ref={modalVideoRef}
                    src={currentSrc}
                    poster={thumbnail || externalPoster}
                    className="max-w-full max-h-[80vh] mx-auto rounded-lg"
                    onClick={toggleModalPlay}
                    onError={(e) => {
                      console.error(`Erro ao carregar vídeo no modal: ${currentSrc}`);
                    }}
                  />
                  
                  {/* Controle central de play/pause que aparece ao passar o mouse */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black/30 rounded-full p-4 transform transition-transform duration-200 pointer-events-auto cursor-pointer" onClick={toggleModalPlay}>
                      {isPlaying ? (
                        <Pause className="h-8 w-8 text-white" />
                      ) : (
                        <Play className="h-8 w-8 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default VideoRenderer;