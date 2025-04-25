// src/pages/Index.tsx
import { useEffect, useState } from "react";
import { CarouselBanner } from "@/components/home/CarouselBanner";
import { QuickAccess } from "@/components/home/QuickAccess";
import { EnhancedCalendarWidget } from "@/components/home/EnhancedCalendarWidget";
import { HomeActivities } from "@/components/home/HomeActivities";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from '@/hooks/usePermission';
// Interfaces para os dados
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

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasPermission } = usePermission();

  // Função para buscar posts da Timeline
  const fetchTimelinePosts = async () => {
    try {
      console.log("Buscando posts da timeline...");
      const response = await api.get('/timeline');
      
      if (Array.isArray(response)) {
        console.log(`Recebidos ${response.length} posts da timeline`);
        setPosts(response);
        
        // Verificar e logar posts com eventData
        const postsWithEvents = response.filter(post => post.eventData);
        if (postsWithEvents.length > 0) {
          console.log(`Encontrados ${postsWithEvents.length} posts com dados de eventos:`);
          postsWithEvents.forEach(post => {
            console.log(`- Evento: ${post.eventData?.title}, Data: ${post.eventData?.date}`);
          });
        }
      } else {
        console.error("Resposta da API não é um array:", response);
      }
    } catch (error) {
      console.error("Erro ao buscar posts da timeline:", error);
      toast({
        title: "Erro ao carregar atividades", 
        description: "Não foi possível carregar as atividades recentes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Buscar dados ao carregar
    setIsLoading(true);
    fetchTimelinePosts();
  }, []);

  return (
    <Layout>
      <div className="space-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8">
        {/* Banner carrossel */}
        <div className="mt-2">
          <CarouselBanner />
        </div>
        
        {/* Cards de acesso rápido */}
        <div className="mt-8">
          <QuickAccess />
        </div>
        {/* Conteúdo principal: Atividades e Calendário */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
          {/* Atividades Recentes (com mais espaço) */}
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <HomeActivities posts={posts} />
          </div>
          
          {/* Calendário - Substituído pelo componente melhorado */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <EnhancedCalendarWidget />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;