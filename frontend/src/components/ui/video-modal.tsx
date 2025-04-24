// src/components/ui/video-modal.tsx
import React, { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X, Download, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoModalProps {
  children: React.ReactNode;
  src: string;
  alt?: string;
  poster?: string;
}

export function VideoModal({ children, src, alt = "Vídeo", poster }: VideoModalProps) {
  const [open, setOpen] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que o click propague
    
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'video';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que o click propague
    
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(!muted);
    }
  };
  
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que o click propague

    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.warn('Erro ao reproduzir vídeo:', err);
          });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Quando o modal abrir, permitir clicar no vídeo para pausar/reproduzir
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (open && videoElement) {
      // Pequeno timeout para garantir que o modal está completamente aberto
      const timeout = setTimeout(() => {
        if (videoElement) {
          // Ao abrir o modal, inicie a reprodução automaticamente
          videoElement.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch(err => {
              console.warn('Erro ao reproduzir vídeo automaticamente:', err);
            });
            
          // Adicionar listener para atualizar o estado de reprodução
          const handlePlayPause = () => {
            setIsPlaying(!videoElement.paused);
          };
          
          videoElement.addEventListener('play', handlePlayPause);
          videoElement.addEventListener('pause', handlePlayPause);
          
          return () => {
            videoElement.removeEventListener('play', handlePlayPause);
            videoElement.removeEventListener('pause', handlePlayPause);
          };
        }
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [open]);
  
  // Ao fechar o modal, pausar o vídeo
  useEffect(() => {
    if (!open && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer" data-modal-trigger="true">{children}</div>
      </DialogTrigger>
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
                setOpen(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center h-full w-full overflow-auto bg-black/90 rounded-lg">
            <div className="p-4 max-h-[90vh] w-full relative group">
              {/* Video com controles */}
              <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="max-w-full max-h-[80vh] mx-auto rounded-lg"
                onClick={togglePlay}
                onError={(e) => {
                  console.error(`Erro ao carregar vídeo no modal: ${src}`);
                }}
              />
              
              {/* Controle central de play/pause que aparece ao passar o mouse */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-black/30 rounded-full p-4 transform transition-transform duration-200 pointer-events-auto cursor-pointer" onClick={togglePlay}>
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
  );
}