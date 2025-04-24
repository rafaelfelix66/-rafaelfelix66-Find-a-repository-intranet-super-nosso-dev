// src/components/home/HomeActivities.tsx
import { useState, useEffect } from "react";
import { 
  FileText, 
  Image, 
  MessageSquare, 
  Clock,
  RefreshCw,
  Loader,
  ChevronRight
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Interface para os posts recebidos da timeline
interface TimelinePost {
  _id: string;
  text: string;
  user: {
    _id: string;
    nome: string;
  };
  attachments: string[];
  createdAt: string;
  timestamp?: string;
  eventData?: any;
}

// Props para o componente
interface HomeActivitiesProps {
  posts: TimelinePost[];
}

export const HomeActivities = ({ posts }: HomeActivitiesProps) => {
  const [activeTab, setActiveTab] = useState("todos");
  const [filteredActivities, setFilteredActivities] = useState<TimelinePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtrar atividades com base na aba selecionada
  useEffect(() => {
    if (posts.length === 0) {
      setFilteredActivities([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Função para determinar o tipo de um post com base em seus atributos
    const getPostType = (post: TimelinePost): 'document' | 'image' | 'comment' | 'event' => {
      if (post.eventData) return 'event';
      if (post.attachments && post.attachments.length > 0) {
        // Verificar se há imagens nos anexos
        const hasImage = post.attachments.some(att => 
          /\.(jpg|jpeg|png|gif|webp)$/i.test(att)
        );
        if (hasImage) return 'image';
      }
      // Se tiver texto mas não tiver anexos, consideramos um comentário
      if (post.text && (!post.attachments || post.attachments.length === 0)) {
        return 'comment';
      }
      // Por padrão, consideramos um documento
      return 'document';
    };

    let filtered = [...posts];
    
    // Aplicar filtro com base na aba selecionada
    if (activeTab !== "todos") {
      const typeMapping: Record<string, string> = {
        "arquivos": "document",
        "imagens": "image",
        "comentarios": "comment"
      };
      
      filtered = posts.filter(post => getPostType(post) === typeMapping[activeTab]);
    }
    
    // Ordenar por data (mais recentes primeiro)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Limitar a 5 itens
    filtered = filtered.slice(0, 5);
    
    setFilteredActivities(filtered);
    setIsLoading(false);
  }, [posts, activeTab]);

  // Obter as iniciais do nome do usuário
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Obter o ícone para cada tipo de atividade
  const getActivityIcon = (post: TimelinePost) => {
    if (post.eventData) return <MessageSquare className="h-4 w-4 text-blue-500" />;
    
    if (post.attachments && post.attachments.length > 0) {
      const hasImage = post.attachments.some(att => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(att)
      );
      if (hasImage) return <Image className="h-4 w-4 text-supernosso-purple" />;
    }
    
    // Comentário ou documento
    return post.text && (!post.attachments || post.attachments.length === 0)
      ? <MessageSquare className="h-4 w-4 text-blue-500" />
      : <FileText className="h-4 w-4 text-supernosso-red" />;
  };

  // Obter o título da atividade
  const getActivityTitle = (post: TimelinePost) => {
    if (post.eventData && post.eventData.title) {
      return post.eventData.title;
    }
    
    if (post.text) {
      // Se tiver texto, usar as primeiras palavras (até 5)
      const words = post.text.split(' ').slice(0, 5).join(' ');
      return words + (post.text.split(' ').length > 5 ? '...' : '');
    }
    
    if (post.attachments && post.attachments.length > 0) {
      const hasImage = post.attachments.some(att => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(att)
      );
      if (hasImage) {
        return `Compartilhou ${post.attachments.length} ${post.attachments.length === 1 ? 'imagem' : 'imagens'}`;
      }
      return `Compartilhou ${post.attachments.length} ${post.attachments.length === 1 ? 'arquivo' : 'arquivos'}`;
    }
    
    return "Nova publicação";
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Atividades Recentes</h2>
        <div className="text-sm text-gray-500">
          Últimas atualizações da equipe
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full grid grid-cols-4 bg-gray-100">
          <TabsTrigger value="todos" className="data-[state=active]:bg-supernosso-red data-[state=active]:text-white text-sm">
            Todos
          </TabsTrigger>
          <TabsTrigger value="arquivos" className="data-[state=active]:bg-supernosso-red data-[state=active]:text-white text-sm">
            Arquivos
          </TabsTrigger>
          <TabsTrigger value="imagens" className="data-[state=active]:bg-supernosso-red data-[state=active]:text-white text-sm">
            Imagens
          </TabsTrigger>
          <TabsTrigger value="comentarios" className="data-[state=active]:bg-supernosso-red data-[state=active]:text-white text-sm">
            Comentários
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {isLoading ? (
          // Esqueletos para carregamento
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <p className="mb-2">Nenhuma atividade encontrada</p>
            <p className="text-sm">
              {activeTab === "todos" 
                ? "Não há atividades recentes registradas" 
                : `Não há atividades do tipo "${activeTab}" registradas`}
            </p>
          </div>
        ) : (
          filteredActivities.map((post) => (
            <Link 
              key={post._id} 
              to={`/timeline`} 
              className="block"
            >
              <div className="flex items-start space-x-4 p-3 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors">
                <Avatar className="h-10 w-10 mt-1">
                  <AvatarImage src={null} />
                  <AvatarFallback className="bg-supernosso-red text-white">
                    {getInitials(post.user.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{post.user.nome}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(post.createdAt), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {getActivityIcon(post)}
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {getActivityTitle(post)}
                    </p>
                  </div>
                  {post.text && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {post.text}
                    </p>
                  )}
                  {post.attachments && post.attachments.length > 0 && (
                    <div className="flex gap-1 mt-2 overflow-hidden">
                      {post.attachments.slice(0, 3).map((attachment, idx) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment);
                        return isImage ? (
                          <div 
                            key={idx} 
                            className="h-14 w-14 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center"
                          >
                            <img 
                              src={attachment} 
                              alt="Anexo" 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                // Fallback para ícone em caso de erro
                                e.currentTarget.parentElement.innerHTML = 
                                  '<div class="flex items-center justify-center h-full w-full bg-gray-200"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg></div>';
                              }}
                            />
                          </div>
                        ) : (
                          <div 
                            key={idx}
                            className="h-14 w-14 rounded-md bg-gray-100 flex items-center justify-center"
                          >
                            <FileText className="h-6 w-6 text-gray-400" />
                          </div>
                        );
                      })}
                      {post.attachments.length > 3 && (
                        <div className="h-14 w-14 rounded-md bg-gray-100 flex items-center justify-center text-sm text-gray-500 font-medium">
                          +{post.attachments.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
        
        <div className="pt-2">
          <Link to="/timeline">
            <Button 
              variant="ghost" 
              className="w-full text-supernosso-red hover:text-supernosso-red hover:bg-supernosso-light-red flex items-center justify-center"
            >
              Ver Todas as Atividades
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};