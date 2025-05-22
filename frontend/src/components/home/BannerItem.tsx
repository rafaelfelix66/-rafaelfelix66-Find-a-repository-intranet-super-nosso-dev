// frontend/src/components/home/BannerItem.tsx
import React from 'react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";

interface BannerItemProps {
  id: string;
  imageUrl: string;
  link?: string;
  title: string;
  description?: string;
}

export const BannerItem: React.FC<BannerItemProps> = ({ 
  id, 
  imageUrl, 
  link, 
  title,
  description
}) => {
  const { toast } = useToast();
  
  // Função para rastrear clique no banner
  const handleBannerClick = async () => {
  try {
    console.log(`Iniciando rastreamento de clique para banner ${id}`);
    
    // Registrar o clique primeiro (independente de haver link)
    await api.get(`/banners/${id}/click`);
    console.log(`Clique registrado com sucesso para banner ${id}`);
    
    // Se há um link, abrir em nova aba
    if (link) {
      console.log(`Abrindo link: ${link}`);
      // Verificar se o link tem protocolo
      let url = link;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      window.open(url, '_blank');
    }
  } catch (error) {
    console.error('Erro ao registrar clique no banner:', error);
    
    // Mesmo com erro, deve abrir o link
    if (link) {
      console.log(`Tentando abrir link após erro: ${link}`);
      // Verificar se o link tem protocolo
      let url = link;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      window.open(url, '_blank');
    }
  }
};
  
  return (
    <div 
      className="relative w-full h-full cursor-pointer overflow-hidden"
      onClick={handleBannerClick}
      title={title}
    >
      <img 
        src={imageUrl} 
        alt={title}
        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        onError={(e) => {
          // Usar imagem de fallback em caso de erro
          const target = e.target as HTMLImageElement;
          target.src = "/placeholder.svg";
        }}
      />
    </div>
  );
}