// src/components/ui/youtube-video.tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

interface YouTubeVideoProps {
  url: string;
  className?: string;
  showThumbnail?: boolean;
}

// Função para extrair o ID do vídeo do YouTube
const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

export function YouTubeVideo({ url, className, showThumbnail = true }: YouTubeVideoProps) {
  const [isPlaying, setIsPlaying] = useState(!showThumbnail);
  const videoId = extractYouTubeVideoId(url);
  
  if (!videoId) {
    return (
      <div className={cn("flex items-center justify-center bg-gray-100 rounded-lg p-8", className)}>
        <p className="text-gray-500">URL do YouTube inválida</p>
      </div>
    );
  }
  
  if (!isPlaying && showThumbnail) {
    return (
      <div 
        className={cn("relative cursor-pointer group", className)}
        onClick={() => setIsPlaying(true)}
      >
        <img
          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
          alt="YouTube video thumbnail"
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            // Fallback para qualidade menor se maxresdefault não existir
            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors rounded-lg">
          <div className="bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform">
            <Play className="h-8 w-8 text-white fill-white ml-1" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative pb-[56.25%]">
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}