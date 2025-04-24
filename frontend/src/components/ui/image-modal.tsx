// src/components/ui/image-modal.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageModalProps {
  children: React.ReactNode;
  src: string;
  alt?: string;
}

export function ImageModal({ children, src, alt = "Imagem" }: ImageModalProps) {
  const [open, setOpen] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que o click propague
    
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'imagem';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const increaseZoom = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que o click propague
    setZoom(prev => Math.min(prev + 0.25, 3));
  };
  
  const decreaseZoom = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que o click propague
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer group relative">
          {children}
          
          {/* Overlay indicando que é clicável */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
            <div className="rounded-full p-2 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl p-0 bg-transparent border-0 overflow-hidden">
        <div className="relative w-full h-full">
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <Button 
              className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white p-0"
              size="icon"
              onClick={decreaseZoom}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white p-0"
              size="icon"
              onClick={increaseZoom}
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
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
            <div className="p-4 max-h-[90vh] relative">
              <img
                src={src}
                alt={alt}
                className="max-w-full object-contain rounded-lg"
                style={{ 
                  transform: `scale(${zoom})`,
                  transition: 'transform 0.2s ease-in-out',
                  transformOrigin: 'center center',
                  maxHeight: 'calc(90vh - 32px)'
                }}
                onError={(e) => {
                  console.error(`Erro ao carregar imagem no modal: ${src}`);
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}