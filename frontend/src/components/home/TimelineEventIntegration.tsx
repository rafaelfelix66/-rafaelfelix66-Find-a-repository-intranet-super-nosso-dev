// src/components/home/TimelineEventIntegration.tsx
import { useState, useEffect } from "react";
import { api } from "@/lib/api"; // Corrigido para usar o mesmo import do Index.tsx
import { toast } from "@/hooks/use-toast";
import { HomeActivities } from "@/components/home/HomeActivities"; // Utilizando o componente existente
import { Skeleton } from "@/components/ui/skeleton";

// Interface para os posts da timeline
interface TimelinePost {
  _id: string;
  text: string;
  user: {
    _id: string;
    nome: string;
  };
  attachments: string[];
  eventData?: {
    title: string;
    date: string;
    location: string;
  };
  createdAt: string;
}

export function TimelineEventIntegration() {
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const fetchTimelinePosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("TimelineEventIntegration: Buscando posts da timeline...");
      const response = await api.get('/timeline');
      
      // CORREÇÃO: Verificar novo formato com paginação
      if (response && response.posts && Array.isArray(response.posts)) {
        console.log(`TimelineEventIntegration: Recebidos ${response.posts.length} posts`);
        setPosts(response.posts);
        
        // Verificar posts com eventos
        const eventsCount = response.posts.filter(post => post.eventData).length;
        console.log(`TimelineEventIntegration: Encontrados ${eventsCount} posts com eventos`);
      } 
      // FALLBACK: Formato antigo (array direto)
      else if (Array.isArray(response)) {
        console.log(`TimelineEventIntegration: Recebidos ${response.length} posts (formato antigo)`);
        setPosts(response);
        
        const eventsCount = response.filter(post => post.eventData).length;
        console.log(`TimelineEventIntegration: Encontrados ${eventsCount} posts com eventos`);
      } else {
        console.error("TimelineEventIntegration: Resposta não é um array nem objeto com posts:", response);
        setError("Formato de resposta inválido");
      }
    } catch (error) {
      console.error("TimelineEventIntegration: Erro ao buscar posts:", error);
      setError("Não foi possível carregar as atividades recentes");
      toast({
        title: "Erro",
        description: "Não foi possível carregar as atividades recentes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchTimelinePosts();
}, []);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p>{error}</p>
      </div>
    );
  }
  
  // Utilizar o componente HomeActivities existente para exibir os posts
  return <HomeActivities posts={posts} />;
}

export default TimelineEventIntegration;