// src/components/home/RecentActivity.tsx
import { useState, useEffect } from "react";
import { 
  FileText, 
  Image, 
  MessageSquare, 
  Clock,
  RefreshCw,
  Loader
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipos de atividades
interface Activity {
  id: string;
  type: 'document' | 'image' | 'comment' | 'event';
  title: string;
  description: string;
  user: {
    id: string;
    name: string;
    initials: string;
  };
  timestamp: Date;
  contentType?: string;
  target?: string;
}

// Dados mockados para usar enquanto a integração com a API não está completa
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'document',
    title: 'Relatório Mensal de Vendas',
    description: 'Adicionou um novo documento na pasta Relatórios',
    user: {
      id: 'user1',
      name: 'João Silva',
      initials: 'JS'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
    contentType: 'document',
    target: '/arquivos/relatorios'
  },
  {
    id: '2',
    type: 'image',
    title: 'Inauguração da Nova Loja',
    description: 'Adicionou 5 fotos ao evento',
    user: {
      id: 'user2',
      name: 'Maria Oliveira',
      initials: 'MO'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 horas atrás
    contentType: 'image',
    target: '/timeline'
  },
  {
    id: '3',
    type: 'comment',
    title: 'Comentou em um documento',
    description: 'Excelente trabalho na apresentação!',
    user: {
      id: 'user3',
      name: 'Pedro Santos',
      initials: 'PS'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 horas atrás
    contentType: 'comment',
    target: '/arquivos'
  },
  {
    id: '4',
    type: 'document',
    title: 'Guia de Treinamento',
    description: 'Atualizou o manual de procedimentos',
    user: {
      id: 'user4',
      name: 'Ana Costa',
      initials: 'AC'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    contentType: 'document',
    target: '/base-conhecimento'
  },
  {
    id: '5',
    type: 'comment',
    title: 'Respondeu a uma pergunta',
    description: 'Esclareceu dúvida sobre o novo sistema',
    user: {
      id: 'user5',
      name: 'Carlos Mendes',
      initials: 'CM'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    contentType: 'comment',
    target: '/base-conhecimento'
  }
];

export const RecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("todos");
  const { toast } = useToast();

  const fetchActivities = async (type: string = "todos") => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simular chamada API com timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filtragem pelo tipo
      let filteredActivities = [...mockActivities];
      
      if (type !== "todos") {
        const typeMapping: Record<string, string> = {
          "arquivos": "document",
          "imagens": "image",
          "comentarios": "comment"
        };
        
        filteredActivities = mockActivities.filter(
          activity => activity.type === typeMapping[type]
        );
      }
      
      setActivities(filteredActivities);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
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

  useEffect(() => {
    fetchActivities(activeTab);
  }, [activeTab]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4 text-supernosso-red" />;
      case 'image':
        return <Image className="h-4 w-4 text-supernosso-purple" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-supernosso-red" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Atividades Recentes</h2>
        <div className="text-xs text-gray-500">
          Veja as últimas atualizações da equipe
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button 
          variant={activeTab === "todos" ? "default" : "outline"} 
          size="sm"
          onClick={() => setActiveTab("todos")}
          className={activeTab === "todos" ? "bg-supernosso-red hover:bg-supernosso-red/90" : ""}
        >
          Todos
        </Button>
        <Button 
          variant={activeTab === "arquivos" ? "default" : "outline"} 
          size="sm"
          onClick={() => setActiveTab("arquivos")}
          className={activeTab === "arquivos" ? "bg-supernosso-red hover:bg-supernosso-red/90" : ""}
        >
          Arquivos
        </Button>
        <Button 
          variant={activeTab === "imagens" ? "default" : "outline"} 
          size="sm"
          onClick={() => setActiveTab("imagens")}
          className={activeTab === "imagens" ? "bg-supernosso-red hover:bg-supernosso-red/90" : ""}
        >
          Imagens
        </Button>
        <Button 
          variant={activeTab === "comentarios" ? "default" : "outline"} 
          size="sm"
          onClick={() => setActiveTab("comentarios")}
          className={activeTab === "comentarios" ? "bg-supernosso-red hover:bg-supernosso-red/90" : ""}
        >
          Comentários
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="animate-spin h-6 w-6 text-supernosso-red mr-2" />
          <span>Carregando atividades...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <p className="mb-4">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchActivities(activeTab)}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <p className="mb-2">Nenhuma atividade encontrada</p>
          <p className="text-sm">
            {activeTab === "todos" 
              ? "Não há atividades recentes registradas" 
              : `Não há atividades do tipo "${activeTab}" registradas`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Link 
              key={activity.id} 
              to={activity.target || "#"} 
              className="block"
            >
              <div className="flex items-start space-x-3 pb-3 border-b last:border-b-0 hover:bg-gray-50 rounded-md p-2 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={null} />
                  <AvatarFallback className="bg-supernosso-red text-white">
                    {activity.user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.user.name}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getActivityIcon(activity.type)}
                    <p className="text-sm font-medium">{activity.title}</p>
                  </div>
                  {activity.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{activity.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
          
          <Button 
            variant="ghost" 
            className="w-full text-supernosso-green hover:text-supernosso-green hover:bg-supernosso-light-green"
            onClick={() => fetchActivities(activeTab)}
          >
            Ver Todas as Atividades
          </Button>
        </div>
      )}
    </div>
  );
};