//src\pages\Timeline.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ImageModal } from "@/components/ui/image-modal";
import { VideoModal } from "@/components/ui/video-modal";
import { VideoRenderer } from "@/components/ui/video-renderer";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Image as ImageIcon,
  Film,
  Calendar,
  Plus,
  X,
  Settings,
  FileSearch
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { api } from '@/services/api';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { OwnershipGuard } from '@/components/auth/OwnershipGuard';
import { useAuth } from '@/contexts/AuthContext';

// Interfaces
interface PostComment {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  content: string;
  timestamp: string;
}

interface Post {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  content: string;
  images?: string[];
  video?: string;
  timestamp: string;
  likes: number;
  comments: PostComment[];
  liked: boolean;
  event?: {
    title: string;
    date: string;
    location: string;
  };
}

// Dados iniciais
const initialPosts: Post[] = [];

// Funções auxiliares integradas
const getInitials = (name: string) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const formatTimestamp = (date: string | Date) => {
  if (!date) return 'algum momento';
  
  const now = new Date();
  const postDate = new Date(date);
  const diff = Math.floor((now.getTime() - postDate.getTime()) / 1000);
  
  if (diff < 60) {
    return 'agora';
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} atrás`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} ${hours === 1 ? 'hora' : 'horas'} atrás`;
  } else if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} ${days === 1 ? 'dia' : 'dias'} atrás`;
  } else {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
};

// Determinar o URL base para as imagens com base no ambiente
const getBaseUrl = () => {
  if (window.location.hostname !== 'localhost') {
    return '';  // Em produção, os caminhos são relativos
  }
  return 'http://localhost:3000'; // Em desenvolvimento local
};

// Função para testar o acesso a um arquivo
const testImageAccess = async (imagePath: string) => {
  try {
    if (!imagePath) {
      console.error('Caminho de imagem vazio');
      return { success: false, error: 'Caminho vazio' };
    }
    
    // Extrair o nome do arquivo do caminho
    const filename = imagePath.split('/').pop();
    if (!filename) {
      console.error('Nome de arquivo inválido');
      return { success: false, error: 'Nome de arquivo inválido' };
    }
    
    console.log(`Testando acesso à imagem: ${filename}`);
    
    // Verificar se o arquivo existe no backend
    const checkResponse = await api.get(`/timeline/check-image/${filename}`);
    console.log('Resposta da verificação de arquivo:', checkResponse);
    
    // Testar carregamento direto da imagem
    const imageUrl = window.location.hostname === 'localhost' 
      ? `http://localhost:3000/uploads/timeline/${filename}`
      : `/uploads/timeline/${filename}`;
      
    console.log(`Tentando carregar imagem diretamente: ${imageUrl}`);
    
    // Usar fetch para verificar se a imagem pode ser acessada
    const fetchResponse = await fetch(imageUrl);
    const status = fetchResponse.status;
    const ok = fetchResponse.ok;
    
    console.log(`Resultado do fetch: status=${status}, ok=${ok}`);
    
    return {
      success: ok,
      status,
      fileCheck: checkResponse,
      testedUrl: imageUrl
    };
  } catch (error) {
    console.error('Erro ao testar acesso à imagem:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

// Componente melhorado para renderizar imagens com tratamento de erro
const ImageRenderer = ({ src, alt, className, enableModal = false }: { src: string, alt: string, className?: string, enableModal?: boolean }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    // Resetar estados quando a fonte muda
    setError(false);
    setLoaded(false);
    setRetryCount(0);
    
    if (!src || typeof src !== 'string') {
      console.log('ImageRenderer: src inválido', src);
      setError(true);
      setCurrentSrc("/placeholder.svg");
      return;
    }

    // Função para processar o URL da imagem
    const processImageUrl = () => {
      // Para desenvolvimento local em localhost, tentamos prefixar o host do backend
      if (!src.startsWith('http') && window.location.hostname === 'localhost') {
        const path = src.startsWith('/') ? src : `/${src}`;
        return `http://localhost:3000${path}`;
      }
      return src;
    };

    const fullSrc = processImageUrl();
    console.log(`ImageRenderer: Tentando carregar imagem: ${fullSrc} (original: ${src}), tentativa: ${retryCount + 1}`);
    setCurrentSrc(fullSrc);
    
    // Pré-carregar a imagem para garantir o carregamento
    const preloadImage = new Image();
    preloadImage.onload = () => {
      console.log(`ImageRenderer: Pré-carregamento bem-sucedido: ${fullSrc}`);
      setLoaded(true);
      setError(false);
    };
    
    preloadImage.onerror = () => {
      console.error(`ImageRenderer: Erro no pré-carregamento: ${fullSrc}`);
      // Tentar URL alternativa ou placeholders
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        
        // Em caso de erro, experimentar uma URL alternativa
        if (fullSrc.includes('localhost')) {
          // Tentar sem o prefixo do host
          const altSrc = src.startsWith('/') ? src : `/${src}`;
          console.log(`ImageRenderer: Tentando URL alternativa: ${altSrc}, tentativa: ${retryCount + 2}`);
          setCurrentSrc(altSrc);
        } else if (retryCount === 0) {
          // Tentar com prefixo em caso de falha inicial
          const altSrc = `http://localhost:3000${src.startsWith('/') ? '' : '/'}${src}`;
          console.log(`ImageRenderer: Tentando URL com prefixo: ${altSrc}, tentativa: ${retryCount + 2}`);
          setCurrentSrc(altSrc);
        } else {
          // Última tentativa: URL original absoluta
          const filename = src.split('/').pop();
          if (filename) {
            const absoluteSrc = `/uploads/timeline/${filename}`;
            console.log(`ImageRenderer: Tentativa final com caminho absoluto: ${absoluteSrc}`);
            setCurrentSrc(absoluteSrc);
          } else {
            setError(true);
            setCurrentSrc("/placeholder.svg");
          }
        }
      } else {
        setError(true);
        setCurrentSrc("/placeholder.svg");
      }
    };
    
    preloadImage.src = fullSrc;
  }, [src, retryCount]);

  // Manipulador de erro para o elemento img real
  const handleError = () => {
    if (retryCount < maxRetries && !error) {
      setRetryCount(prev => prev + 1);
    } else if (!error) {
      console.error(`ImageRenderer: Erro final ao carregar imagem: ${currentSrc}`);
      setError(true);
      setCurrentSrc("/placeholder.svg");
    }
  };

  const imageContent = (
    <div className="relative w-full h-full overflow-hidden">
      {/* Imagem principal */}
      <img 
        src={currentSrc}
        alt={alt || "Imagem"}
        className={className}
        onLoad={() => {
          console.log(`ImageRenderer: Imagem carregada com sucesso: ${currentSrc}`);
          setLoaded(true);
          setError(false);
        }}
        onError={handleError}
        style={{ display: loaded ? 'block' : 'none' }}
      />
      
      {/* Placeholder enquanto carrega */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <div className="animate-pulse bg-gray-200 w-full h-full"></div>
        </div>
      )}
      
      {/* Mensagem de erro */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 text-gray-500 text-xs p-2 text-center">
          <div>
            Não foi possível carregar a imagem
            <button 
              className="block mx-auto mt-2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              onClick={() => {
                setError(false);
                setLoaded(false);
                setRetryCount(0);
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Se o modal estiver habilitado e não houver erro, envolver com o modal
  if (enableModal && !error && loaded) {
    return (
      <ImageModal src={currentSrc} alt={alt}>
        {imageContent}
      </ImageModal>
    );
  }

  // Caso contrário, retornar apenas a imagem
  return imageContent;
};
// Componente de diagnóstico de imagens
const ImageDiagnosticTool = ({ post }: { post: Post }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const runDiagnostic = async () => {
    if (!post.images || post.images.length === 0) {
      toast({
        title: "Sem imagens",
        description: "Este post não contém imagens para diagnosticar.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const diagnosticResult = await testImageAccess(post.images[0]);
      setResult(diagnosticResult);
      console.log('Resultado do diagnóstico:', diagnosticResult);
    } catch (error) {
      console.error('Erro ao executar diagnóstico:', error);
      setResult({ success: false, error: 'Erro ao executar diagnóstico' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mt-2">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium">Ferramenta de Diagnóstico</h4>
        <Button 
          size="sm" 
          variant="outline"
          onClick={runDiagnostic}
          disabled={loading}
        >
          {loading ? 'Analisando...' : 'Verificar Imagem'}
        </Button>
      </div>
      
      {result && (
        <div className="text-xs">
          <p className={result.success ? 'text-green-600' : 'text-red-600'}>
            Status: {result.success ? 'Acessível' : 'Inacessível'}
          </p>
          {result.testedUrl && (
            <p className="truncate">URL: {result.testedUrl}</p>
          )}
          {result.status && (
            <p>Status HTTP: {result.status}</p>
          )}
          {result.error && (
            <p className="text-red-600">Erro: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

// Funções de integração com a API
const normalizePath = (path: string): string => {
  if (!path) return '';
  
  // Não modificar URLs absolutas
  if (path.startsWith('http')) {
    return path;
  }
  
  // Garantir que o caminho comece com /
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  
  // Para desenvolvimento local, adicionar o host do backend
  if (window.location.hostname === 'localhost') {
    return `http://localhost:3000${path}`;
  }
  
  return path;
};

// Função de busca de posts
const fetchPosts = async () => {
  try {
    const data = await api.get('/timeline');
    
    if (Array.isArray(data)) {
      const userId = localStorage.getItem('userId');
      
      const formattedPosts = data.map(post => {
        console.log(`Post ${post._id}:`, {
          text: post.text ? post.text.substring(0, 30) : "Sem texto",
          hasAttachments: !!post.attachments && post.attachments.length > 0,
          attachments: post.attachments,
          images: post.images,
          event: post.event,
          eventData: post.eventData
        });
        
        const formattedPost = {
          id: post._id,
          user: {
            name: post.user?.nome || 'Usuário',
            initials: getInitials(post.user?.nome || 'Usuário')
          },
          content: post.text || "",
          timestamp: formatTimestamp(post.createdAt),
          likes: post.likes?.length || 0,
          comments: (post.comments || []).map(comment => ({
            id: comment._id,
            user: {
              name: comment.user?.nome || 'Usuário',
              initials: getInitials(comment.user?.nome || 'Usuário')
            },
            content: comment.text,
            timestamp: formatTimestamp(comment.createdAt)
          })),
          liked: post.likes?.some(like => 
            like.toString() === userId || 
            like === userId
          ) || false,
          images: [],
          event: null // Inicializar como null
        };
        
        // CORREÇÃO: Verificar tanto eventData quanto event
        // Priorizar eventData se ambos existirem
        if (post.eventData && typeof post.eventData === 'object') {
          console.log(`Post ${post._id} tem eventData:`, post.eventData);
          formattedPost.event = {
            title: post.eventData.title || '',
            date: post.eventData.date || '',
            location: post.eventData.location || ''
          };
        } else if (post.event && typeof post.event === 'object') {
          console.log(`Post ${post._id} tem event:`, post.event);
          formattedPost.event = post.event;
        }
        
        // Verificar se o evento está completo
        if (formattedPost.event) {
          console.log(`Post ${post._id} tem evento processado:`, formattedPost.event);
        }
        
        // Processar imagens/anexos - simplificado para usar apenas attachments
        if (post.attachments && post.attachments.length > 0) {
          formattedPost.images = post.attachments
            .filter(attachment => attachment) // Filtrar valores vazios
            .map(attachment => normalizePath(attachment));
        }
        
        console.log(`Post ${post._id} - imagens processadas:`, formattedPost.images);
        return formattedPost;
      });
      
      return formattedPosts;
    } else {
      console.error('Resposta do backend não é um array:', data);
      return [];
    }
  } catch (error) {
    console.error('Erro ao carregar posts:', error);
    throw new Error('Não foi possível carregar os posts');
  }
};

// Função para criar um novo post
const createNewPostApi = async (
  text: string, 
  files: File[], 
  eventData?: { title: string; date: string; location: string }
) => {
  try {
    const formData = new FormData();
    
    // Adicionar texto se existir
    if (text) {
      formData.append('text', text);
    }
    
    // Adicionar arquivos se existirem
    if (files.length > 0) {
      files.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    // Processar dados do evento
    if (eventData) {
      // Certificar-se de que o eventData seja uma string JSON
      formData.append('eventData', JSON.stringify(eventData));
      console.log("Evento adicionado ao FormData:", JSON.stringify(eventData));
    }
    
    console.log("Enviando formData:", {
      text,
      filesCount: files.length,
      eventData: eventData ? JSON.stringify(eventData) : 'ausente'
    });
    
    // Verificar o FormData antes de enviar
    for (const [key, value] of formData.entries()) {
      console.log(`FormData contém: ${key} => ${typeof value === 'object' ? 'File/Object' : value}`);
    }
    
    const data = await api.upload('/timeline', formData);
    console.log("Resposta do servidor:", data);
    
    const formattedPost = {
      id: data._id,
      user: {
        name: data.user?.nome || 'Você',
        initials: data.user?.nome ? getInitials(data.user.nome) : 'VC'
      },
      content: data.text || "",
      timestamp: 'agora',
      likes: data.likes?.length || 0,
      comments: [],
      liked: false,
      images: [],
	  event: null as any
    };
    
    // Processar imagens/anexos
    if (data.attachments && data.attachments.length > 0) {
      formattedPost.images = data.attachments
        .filter(att => att)
        .map(att => normalizePath(att));
    }
    
    // Processar dados do evento
    if (data.eventData || data.event) {
      try {
        // O controlador pode retornar eventData ou event já processado
        if (data.event) {
          formattedPost.event = data.event;
          console.log("Evento já processado pelo backend:", formattedPost.event);
        } else if (data.eventData) {
          const eventInfo = typeof data.eventData === 'string' 
            ? JSON.parse(data.eventData)
            : data.eventData;
            
          formattedPost.event = {
            title: eventInfo.title || '',
            date: eventInfo.date || '',
            location: eventInfo.location || ''
          };
          
          console.log("Evento processado localmente:", formattedPost.event);
        }
      } catch (e) {
        console.error('Erro ao processar dados do evento na resposta:', e);
      }
    } else if (eventData) {
      // Se o backend não retornou dados do evento, mas enviamos um, use os dados enviados
      formattedPost.event = eventData;
      console.log("Usando dados de evento enviados:", formattedPost.event);
    }
    
    console.log("Post formatado final:", {
      id: formattedPost.id,
      content: formattedPost.content,
      hasEvent: !!formattedPost.event,
      eventTitle: formattedPost.event?.title || 'N/A'
    });
    
    return formattedPost;
  } catch (error) {
    console.error('Erro ao criar post:', error);
    throw new Error('Não foi possível criar a publicação');
  }
};

const toggleLikePost = async (postId: string) => {
  try {
    const updatedLikes = await api.put(`/timeline/${postId}/like`);
    return updatedLikes;
  } catch (error) {
    console.error('Erro ao curtir post:', error);
    throw new Error('Não foi possível curtir a publicação');
  }
};

const addComment = async (postId: string, text: string) => {
  try {
    const updatedPost = await api.post(`/timeline/${postId}/comment`, { text });
    
    const formattedComments = updatedPost.comments.map(comment => ({
      id: comment._id,
      user: {
        name: comment.user?.nome || 'Usuário',
        initials: getInitials(comment.user?.nome || 'Usuário')
      },
      content: comment.text,
      timestamp: formatTimestamp(comment.createdAt)
    }));
    
    return formattedComments;
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    throw new Error('Não foi possível adicionar o comentário');
  }
};

// Função para determinar o tipo de arquivo
const getFileType = (url: string): 'image' | 'video' | 'unknown' => {
  if (!url) return 'unknown';
  
  const extension = url.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
    return 'image';
  } else if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv'].includes(extension)) {
    return 'video';
  }
  
  return 'unknown';
};

// Componente Timeline
const Timeline = () => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("todos");
  const [newPostDialog, setNewPostDialog] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiagnosticTools, setShowDiagnosticTools] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { currentUser, hasPermission } = useAuth();

  const diagnosticAllImages = async () => {
    if (posts.length === 0) {
      toast({
        title: "Sem posts para diagnóstico",
        description: "Não há posts disponíveis para testar imagens.",
        variant: "destructive"
      });
      return;
    }
    
    const postsWithImages = posts.filter(post => post.images && post.images.length > 0);
    
    if (postsWithImages.length === 0) {
      toast({
        title: "Sem imagens para diagnóstico",
        description: "Existem posts, mas nenhum contém imagens.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Iniciando diagnóstico completo",
      description: `Testando ${postsWithImages.length} posts com imagens...`
    });
    
    // Testar a primeira imagem de cada post
    const results = await Promise.all(
      postsWithImages.map(post => testImageAccess(post.images[0]))
    );
    
    const successCount = results.filter(r => r.success).length;
    
    console.log('Resultados completos do diagnóstico:', results);
    
    toast({
      title: "Diagnóstico completo",
      description: `${successCount} de ${results.length} imagens estão acessíveis.`,
      variant: successCount === results.length ? "default" : "destructive"
    });
    
    // Se houver falhas, mostrar detalhes
    if (successCount < results.length) {
      const failures = results.filter(r => !r.success);
      failures.forEach((failure, index) => {
        toast({
          title: `Falha #${index + 1}`,
          description: failure.error || 'Erro desconhecido',
          variant: "destructive"
        });
      });
    }
  };

  useEffect(() => {
    const loadPosts = async () => {
      if (!token) {
        console.error('Token não encontrado');
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fetchedPosts = await fetchPosts();
        fetchedPosts.forEach(post => {
          console.log('Post com imagens:', {
            postId: post.id,
            content: post.content?.substring(0, 30) + '...',
            images: post.images,
            attachments: post.attachments,
            imageUrls: post.images?.map(img => {
              const baseUrl = process.env.NODE_ENV === 'development' 
                ? 'http://localhost:3000' 
                : window.location.origin;
              return `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
            })
          });
        });
        setPosts(fetchedPosts);
      } catch (error) {
        setError('Não foi possível carregar os posts');
        toast({ 
          title: "Erro", 
          description: "Não foi possível carregar os posts.", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [token, navigate]);
  
  useEffect(() => {
  // Função para pré-carregar todas as imagens dos posts
  const preloadAllImages = () => {
    if (!posts || posts.length === 0) return;
    
    const allImagePaths = posts
      .filter(post => post.images && post.images.length > 0)
      .flatMap(post => post.images);
    
    if (allImagePaths.length === 0) return;
    
    console.log(`Pré-carregando ${allImagePaths.length} imagens...`);
    
    allImagePaths.forEach((path, index) => {
      if (!path) return;
      
      // Criar um elemento de imagem para pré-carregar
      setTimeout(() => {
        const img = new Image();
        const fullSrc = path.startsWith('http') 
          ? path 
          : `http://localhost:3000${path.startsWith('/') ? '' : '/'}${path}`;
        
        img.onload = () => console.log(`Pré-carregamento concluído: ${fullSrc}`);
        img.onerror = () => console.error(`Erro no pré-carregamento: ${fullSrc}`);
        img.src = fullSrc;
      }, index * 50); // Escalonar o carregamento para não sobrecarregar o navegador
    });
  };
  
  if (!loading && posts.length > 0) {
    preloadAllImages();
  }
}, [posts, loading]);

  const createNewPost = async () => {
  if (!token) {
    console.error('Token não encontrado');
    navigate('/login');
    return;
  }

  // Verificar conteúdo mínimo para publicação
  const hasContent = newPostContent.trim().length > 0;
  const hasMedia = selectedImages.length > 0 || selectedVideo !== null;
  const hasEvent = showEventForm && eventTitle.trim() && eventLocation.trim() && eventDate;

  if (!hasContent && !hasMedia && !hasEvent) {
    toast({
      title: "Conteúdo vazio",
      description: "Adicione um texto, mídia ou um evento para publicar.",
      variant: "destructive"
    });
    return;
  }

  // Validar dados do evento se estiver habilitado
  if (showEventForm && (!eventTitle.trim() || !eventLocation.trim() || !eventDate)) {
    toast({
      title: "Detalhes do evento incompletos",
      description: "Preencha todos os campos do evento.",
      variant: "destructive"
    });
    return;
  }

  try {
    // Preparar arquivos
    const files = selectedVideo ? [selectedVideo] : selectedImages;
    
    // Preparar dados do evento
    let eventData = undefined;
    if (showEventForm && eventDate) {
      eventData = {
        title: eventTitle.trim(),
        date: format(eventDate, "d 'de' MMMM, yyyy", { locale: ptBR }),
        location: eventLocation.trim()
      };
      
      console.log("Dados do evento a serem enviados:", eventData);
    }

    // Indicar que estamos processando
    toast({
      title: "Enviando publicação",
      description: "Aguarde enquanto processamos sua publicação..."
    });

    const newPost = await createNewPostApi(newPostContent, files, eventData);
    
    setPosts(prevPosts => [newPost, ...prevPosts]);

    toast({ 
      title: "Publicação criada", 
      description: "Sua publicação foi compartilhada com sucesso!" 
    });

    // Limpar o formulário
    setNewPostContent("");
    setSelectedImages([]);
    setPreviewImages([]);
    setSelectedVideo(null);
    setPreviewVideo(null);
    setShowEventForm(false);
    setEventTitle("");
    setEventLocation("");
    setEventDate(undefined);
    setNewPostDialog(false);
  } catch (error) {
    console.error('Erro ao enviar post:', error);
    toast({ 
      title: "Erro", 
      description: error instanceof Error ? error.message : "Não foi possível criar a publicação.",
      variant: "destructive" 
    });
  }
};


  
	// Componente para exibir informações de evento
	const EventCard = ({ event }) => {
	  if (!event || !event.title || !event.date || !event.location) {
		return null;
	  }

	  return (
		<div className="bg-[#e60909]/10 rounded-lg p-3 mb-4">
		  <div className="flex items-center">
			<Calendar className="h-5 w-5 text-[#e60909] mr-2" />
			<h4 className="font-medium text-[#e60909]">{event.title}</h4>
		  </div>
		  <div className="text-sm ml-7 space-y-1 mt-1">
			<p className="text-gray-600">{event.date}</p>
			<p className="text-gray-600">{event.location}</p>
		  </div>
		</div>
	  );
	};
  const handleLike = async (postId: string) => {
    if (!token) {
      console.error('Token não encontrado');
      navigate('/login');
      return;
    }

    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const wasLiked = targetPost.liked;

    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));

    try {
      const updatedLikes = await toggleLikePost(postId);
      const userId = localStorage.getItem('userId');
      const isNowLiked = updatedLikes.some(id => id === userId || id.toString() === userId);

      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            liked: isNowLiked,
            likes: updatedLikes.length
          };
        }
        return post;
      }));
    } catch (error) {
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            liked: wasLiked,
            likes: wasLiked ? post.likes + 1 : post.likes - 1
          };
        }
        return post;
      }));

      toast({ 
        title: "Erro", 
        description: "Não foi possível curtir a publicação.",
        variant: "destructive" 
      });
    }
  };

  const handleComment = async (postId: string) => {
    if (!token) {
      console.error('Token não encontrado');
      navigate('/login');
      return;
    }

    if (!commentInput[postId]?.trim()) return;

    const commentText = commentInput[postId];
    setCommentInput(prev => ({ ...prev, [postId]: '' }));

    const tempId = `temp-${Date.now()}`;
    const tempComment = {
      id: tempId,
      user: { name: 'Você', initials: 'VC' },
      content: commentText,
      timestamp: 'agora'
    };

    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, tempComment] };
      }
      return post;
    }));

    try {
      const updatedComments = await addComment(postId, commentText);
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return { ...post, comments: updatedComments };
        }
        return post;
      }));
    } catch (error) {
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return { ...post, comments: post.comments.filter(c => c.id !== tempId) };
        }
        return post;
      }));

      toast({ 
        title: "Erro", 
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive" 
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImages = filesArray.slice(0, 4);
      setSelectedImages(prevImages => [...prevImages, ...newImages].slice(0, 4));
      const newPreviewUrls = newImages.map(file => URL.createObjectURL(file));
      setPreviewImages(prevPreviewUrls => [...prevPreviewUrls, ...newPreviewUrls].slice(0, 4));
      if (e.target.value) e.target.value = '';
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImages([]);
      setPreviewImages([]);
      const file = e.target.files[0];
      setSelectedVideo(file);
      setPreviewVideo(URL.createObjectURL(file));
      if (e.target.value) e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newSelectedImages = [...selectedImages];
    const newPreviewImages = [...previewImages];
    URL.revokeObjectURL(newPreviewImages[index]);
    newSelectedImages.splice(index, 1);
    newPreviewImages.splice(index, 1);
    setSelectedImages(newSelectedImages);
    setPreviewImages(newPreviewImages);
  };

  const removeVideo = () => {
    if (previewVideo) {
      URL.revokeObjectURL(previewVideo);
    }
    setSelectedVideo(null);
    setPreviewVideo(null);
  };

  const toggleEventForm = () => {
    setShowEventForm(!showEventForm);
    if (!showEventForm) {
      setEventTitle("");
      setEventLocation("");
      setEventDate(undefined);
    }
  };

  const filteredPosts = activeTab === "todos" 
    ? posts 
    : activeTab === "fotos" 
      ? posts.filter(post => post.images && post.images.length > 0)
      : activeTab === "videos"
        ? posts.filter(post => post.video)
        : posts.filter(post => post.event);

const deletePost = async (postId: string) => {
  if (!token) {
    console.error('Token não encontrado');
    navigate('/login');
    return;
  }

  try {
    // Mostrar toast de confirmação
    toast({
      title: "Confirmação",
      description: "Tem certeza que deseja excluir esta publicação?",
      action: (
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={async () => {
              try {
                console.log(`Iniciando exclusão do post ${postId}`);
                
                // Melhorar tratamento de erros
                try {
                  await api.deletePost(postId);
                  
                  // Atualizar estado localmente após confirmar a exclusão bem-sucedida
                  setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
                  
                  toast({ 
                    title: "Sucesso", 
                    description: "Publicação excluída com sucesso." 
                  });
                } catch (error) {
                  console.error('Erro na exclusão do post:', error);
                  
                  // Mensagem mais descritiva do erro
                  toast({
                    title: "Erro",
                    description: error instanceof Error 
                      ? `Falha ao excluir: ${error.message}`
                      : "Não foi possível excluir a publicação.",
                    variant: "destructive"
                  });
                }
              } catch (error) {
                toast({
                  title: "Erro",
                  description: "Não foi possível completar a ação.",
                  variant: "destructive"
                });
              }
            }}
          >
            Excluir
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              toast({
                title: "Cancelado",
                description: "A exclusão foi cancelada."
              });
            }}
          >
            Cancelar
          </Button>
        </div>
      ),
    });
  } catch (error) {
    console.error('Erro ao processar exclusão:', error);
    toast({ 
      title: "Erro", 
      description: "Não foi possível processar a solicitação de exclusão.",
      variant: "destructive" 
    });
  }
};

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Timeline</h1>
            <p className="text-muted-foreground">Compartilhe e acompanhe eventos da empresa</p>
          </div>
          
          <div className="flex space-x-2">
            {/* Botão para criar nova publicação - apenas para quem tem permissão */}
            <PermissionGuard 
              requiredPermission="timeline:create"
              fallback={<p className="text-sm text-muted-foreground">Você não tem permissão para criar publicações</p>}
            >
              <Dialog open={newPostDialog} onOpenChange={setNewPostDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#e60909] hover:bg-[#e60909]/90 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Publicação
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Publicação</DialogTitle>
                    <DialogDescription>
                      Compartilhe novidades, eventos ou atualizações com a equipe.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-start space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-[#e60909] text-white">
                          VC
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">Você</p>
                        <Textarea 
                          placeholder="O que você deseja compartilhar?" 
                          className="mt-2 focus-visible:ring-[#e60909] resize-none"
                          rows={4}
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                        />
                      </div>
                    </div>

                    {previewImages.length > 0 && (
                      <div className={cn(
                        "grid gap-2 mt-4", 
                        previewImages.length > 1 ? "grid-cols-2" : "grid-cols-1"
                      )}>
                        {previewImages.map((img, idx) => (
                          <div key={idx} className="relative aspect-video overflow-hidden rounded-lg">
                            <ImageRenderer 
                              src={img} 
                              alt={`Imagem ${idx + 1}`} 
                              className="object-cover w-full h-full"
                              enableModal={true}
                            />
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="absolute top-1 right-1 h-6 w-6 rounded-full"
                              onClick={() => removeImage(idx)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
   
                    {previewVideo && (
                      <div className="mt-4 rounded-lg overflow-hidden relative">
                        <VideoRenderer 
                          src={previewVideo} 
                          alt="Preview de vídeo" 
                          className="w-full h-64"
                          enableModal={false}  // Não precisamos de modal no preview
                        />
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-1 right-1 h-6 w-6 rounded-full"
                          onClick={removeVideo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
   
                    {showEventForm && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4 mt-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-[#e60909] flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> 
                            Detalhes do Evento
                          </h3>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={toggleEventForm}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="event-title">Título do evento *</Label>
                            <Input
                              id="event-title"
                              placeholder="Ex: Reunião de Equipe"
                              value={eventTitle}
                              onChange={(e) => setEventTitle(e.target.value)}
                              className={!eventTitle.trim() ? "border-red-300 focus-visible:ring-red-500" : ""}
                            />
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="event-location">Local *</Label>
                            <Input
                              id="event-location"
                              placeholder="Ex: Sala de Reuniões, Loja Centro"
                              value={eventLocation}
                              onChange={(e) => setEventLocation(e.target.value)}
                              className={!eventLocation.trim() ? "border-red-300 focus-visible:ring-red-500" : ""}
                            />
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                            <Label>Data *</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !eventDate && "text-muted-foreground border-red-300"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {eventDate ? (
                                    format(eventDate, "PPP", { locale: ptBR })
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                  mode="single"
                                  selected={eventDate}
                                  onSelect={setEventDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            {showEventForm && !eventDate && (
                              <p className="text-xs text-red-500 mt-1">Data é obrigatória</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        ref={imageInputRef}
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        onChange={handleImageSelect}
                        disabled={!!selectedVideo || previewImages.length >= 4}
                      />
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={!!selectedVideo || previewImages.length >= 4}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {previewImages.length > 0 ? 
                          `Fotos (${previewImages.length}/4)` : 
                          "Adicionar Fotos"
                        }
                      </Button>
                      <input 
                        type="file" 
                        ref={videoInputRef}
                        accept="video/*" 
                        className="hidden" 
                        onChange={handleVideoSelect}
                        disabled={previewImages.length > 0}
                      />
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={previewImages.length > 0 || !!selectedVideo}
                      >
                        <Film className="mr-2 h-4 w-4" />
                        {selectedVideo ? "Vídeo Selecionado" : "Adicionar Vídeo"}
                      </Button>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "flex-1",
                          showEventForm && "bg-gray-100 dark:bg-gray-700"
                        )}
                        onClick={toggleEventForm}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {showEventForm ? "Cancelar Evento" : "Criar Evento"}
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setNewPostContent("");
                        setSelectedImages([]);
                        setPreviewImages([]);
                        setSelectedVideo(null);
                        setPreviewVideo(null);
                        setShowEventForm(false);
                        setEventTitle("");
                        setEventLocation("");
                        setEventDate(undefined);
                        setNewPostDialog(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      className="bg-[#e60909] hover:bg-[#e60909]/90 text-white"
                      onClick={createNewPost}
                    >
                      Publicar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </PermissionGuard>
          </div>
        </div>
        
        <Tabs defaultValue="todos" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="todos" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <p>Carregando publicações...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>{error}</p>
                <Button 
                  className="mt-4 bg-[#e60909] hover:bg-[#e60909]/90 text-white"
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <Card key={post.id} className="animate-fade-in">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex space-x-3">
                        <Avatar>
                          <AvatarImage src={post.user.avatar} />
                          <AvatarFallback className="bg-[#e60909] text-white">
                            {post.user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{post.user.name}</CardTitle>
                          <CardDescription>{post.timestamp}</CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <PermissionGuard requiredPermission="timeline:save">
                            <DropdownMenuItem>Salvar</DropdownMenuItem>
                          </PermissionGuard>
                          <PermissionGuard requiredPermission="timeline:report">
                            <DropdownMenuItem>Reportar</DropdownMenuItem>
                          </PermissionGuard>
                          <OwnershipGuard
                            resourceOwnerId={post.user.id}
                            specialPermission="timeline:delete_any"
                          >
                            <DropdownMenuItem 
                              className="text-red-500"
                              onClick={(e) => {
                                e.preventDefault();
                                deletePost(post.id);
                              }}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </OwnershipGuard>
                          {showDiagnosticTools && post.images && post.images.length > 0 && (
                            <PermissionGuard requiredPermission="timeline:diagnostics">
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault();
                                testImageAccess(post.images[0]).then(result => {
                                  console.log('Resultado do diagnóstico:', result);
                                  toast({
                                    title: result.success ? 'Imagem acessível' : 'Erro no acesso',
                                    description: result.success 
                                      ? `Status: ${result.status}, URL: ${result.testedUrl}` 
                                      : `Erro: ${result.error || 'Desconhecido'}`,
                                    variant: result.success ? 'default' : 'destructive'
                                  });
                                });
                              }}>
                                Diagnosticar Imagem
                              </DropdownMenuItem>
                            </PermissionGuard>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="mb-4 whitespace-pre-line">{post.content}</p>
                    
                    {/* Exibição de informações do evento */}
                    {post.event && post.event.title && (
                      <div className="bg-[#e60909]/10 rounded-lg p-3 mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-[#e60909] mr-2" />
                          <h4 className="font-medium text-[#e60909]">{post.event.title}</h4>
                        </div>
                        <div className="text-sm ml-7 space-y-1 mt-1">
                          <p className="text-gray-600">{post.event.date}</p>
                          <p className="text-gray-600">{post.event.location}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Exibição de imagens */}
                    {post.images && post.images.length > 0 && (
                      <div className={cn(
                        "grid gap-2 mb-4", 
                        post.images.length > 1 ? "grid-cols-2" : "grid-cols-1"
                      )}>
                        {post.images.map((img, idx) => {
                          const fileType = getFileType(img);
                          
                          return (
                            <div key={idx} className="relative aspect-video overflow-hidden rounded-lg">
                              {fileType === 'image' ? (
                                <ImageRenderer 
                                  src={img} 
                                  alt={`Anexo ${idx + 1}`} 
                                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                                  enableModal={true}
                                />
                              ) : fileType === 'video' ? (
                                <VideoRenderer 
                                  src={img} 
                                  alt={`Anexo ${idx + 1}`} 
                                  className="w-full h-full object-cover"
                                  enableModal={true}
                                />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
                                  <span className="text-gray-500">Anexo não suportado</span>
                                </div>
                              )}
                              
                              {showDiagnosticTools && (
                                <PermissionGuard requiredPermission="timeline:diagnostics">
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    className="absolute bottom-2 right-2 bg-white bg-opacity-80 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      testImageAccess(img).then(result => {
                                        console.log('Resultado do diagnóstico:', result);
                                        toast({
                                          title: result.success ? 'Arquivo acessível' : 'Erro no acesso',
                                          description: result.success 
                                            ? `Status: ${result.status}, URL: ${result.testedUrl}` 
                                            : `Erro: ${result.error || 'Desconhecido'}`,
                                          variant: result.success ? 'default' : 'destructive'
                                        });
                                      });
                                    }}
                                  >
                                    Diagnosticar
                                  </Button>
                                </PermissionGuard>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {post.video && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <VideoRenderer 
                          src={post.video} 
                          alt={`Vídeo do post`} 
                          className="w-full h-64 object-cover"
                          enableModal={true}
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 pt-2 border-t">
                      <div>{post.likes} curtidas</div>
                      <div>{post.comments.length} comentários</div>
                    </div>
                    
                    {showDiagnosticTools && post.images && post.images.length > 0 && (
                      <PermissionGuard requiredPermission="timeline:diagnostics">
                        <ImageDiagnosticTool post={post} />
                      </PermissionGuard>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <div className="flex justify-around w-full border-y py-1">
                      <PermissionGuard requiredPermission="timeline:like">
                        <Button 
                          variant="ghost" 
                          className={cn(
                            "flex-1", 
                            post.liked ? "text-[#e60909]" : ""
                          )}
                          onClick={() => handleLike(post.id)}
                        >
                          <Heart className={cn("mr-1 h-4 w-4", post.liked ? "fill-[#e60909]" : "")} />
                          Curtir
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard requiredPermission="timeline:comment">
                        <Button variant="ghost" className="flex-1">
                          <MessageCircle className="mr-1 h-4 w-4" />
                          Comentar
                        </Button>
                      </PermissionGuard>
                    </div>
                    {post.comments.length > 0 && (
                      <div className="space-y-3 w-full">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.user.avatar} />
                              <AvatarFallback className="bg-[#e60909] text-white text-xs">
                                {comment.user.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 px-3">
                                <div className="font-medium text-sm">{comment.user.name}</div>
                                <div className="text-sm">{comment.content}</div>
                              </div>
                              <div className="flex text-xs text-gray-500 mt-1 ml-2 space-x-3">
                                <span>{comment.timestamp}</span>
                                <PermissionGuard requiredPermission="timeline:like_comment">
                                  <button className="hover:text-[#e60909]">Curtir</button>
                                </PermissionGuard>
                                <PermissionGuard requiredPermission="timeline:comment">
                                  <button className="hover:text-[#e60909]">Responder</button>
                                </PermissionGuard>
                                <OwnershipGuard
                                  resourceOwnerId={comment.user.id}
                                  specialPermission="timeline:delete_any_comment"
                                >
                                  <button className="hover:text-red-500">Excluir</button>
                                </OwnershipGuard>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <PermissionGuard requiredPermission="timeline:comment">
                      <div className="flex space-x-3 w-full">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-[#e60909] text-white text-xs">
                            VC
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex">
                          <Input 
                            placeholder="Escreva um comentário..." 
                            className="rounded-r-none focus-visible:ring-0 border-r-0"
                            value={commentInput[post.id] || ''}
                            onChange={(e) => setCommentInput({
                              ...commentInput,
                              [post.id]: e.target.value
                            })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleComment(post.id);
                              }
                            }}
                          />
                          <Button 
                            className="rounded-l-none bg-[#e60909] hover:bg-[#e60909]/90 text-white"
                            onClick={() => handleComment(post.id)}
                            disabled={!commentInput[post.id]?.trim()}
                          >
                            Enviar
                          </Button>
                        </div>
                      </div>
                    </PermissionGuard>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 inline-block">
                  {activeTab === "fotos" ? (
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                  ) : activeTab === "videos" ? (
                    <Film className="h-10 w-10 text-gray-400" />
                  ) : activeTab === "eventos" ? (
                    <Calendar className="h-10 w-10 text-gray-400" />
                  ) : (
                    <MessageCircle className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-medium mt-4">Nenhuma publicação encontrada</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {activeTab === "fotos" 
                    ? "Ainda não há fotos compartilhadas" 
                    : activeTab === "videos"
                      ? "Ainda não há vídeos compartilhados"
                      : activeTab === "eventos"
                        ? "Ainda não há eventos compartilhados"
                        : "Comece compartilhando algo com sua equipe"}
                </p>
                <PermissionGuard requiredPermission="timeline:create">
                  <Button 
                    className="mt-4 bg-[#e60909] hover:bg-[#e60909]/90 text-white"
                    onClick={() => setNewPostDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Publicação
                  </Button>
                </PermissionGuard>
              </div>
            )}
          </TabsContent>
          <TabsContent value="fotos" className="space-y-6" />
          <TabsContent value="videos" className="space-y-6" />
          <TabsContent value="eventos" className="space-y-6" />
        </Tabs>
      </div>
    </Layout>
  );
};

export default Timeline;