// src/pages/Home.tsx - PARTE 1: LÓGICA
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { CarouselBanner } from "@/components/home/CarouselBanner";
import { EnhancedCalendarWidget } from "@/components/home/EnhancedCalendarWidget";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from '@/hooks/usePermission';
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

// Importações específicas da Timeline
import { ImageModal } from "@/components/ui/image-modal";
import { VideoModal } from "@/components/ui/video-modal";
import { VideoRenderer } from "@/components/ui/video-renderer";
import DepartamentoSelector from "@/components/timeline/DepartamentoSelector";
import { LinkifiedText } from "@/components/timeline/LinkifiedText";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { AniversariosWidget } from "@/components/home/AniversariosWidget";
import { UserAvatar } from "@/components/ui/user-avatar";
import { EngagementRanking } from "@/components/home/EngagementRanking";
import { SuperCoinWidget } from "@/components/supercoin/SuperCoinWidget";
import { EmojiInput } from "@/components/ui/emoji-input";
import { ReactionPicker } from '@/components/ui/reaction-picker';
import { CustomEmojiDisplay, getAllCustomEmojis } from '@/components/ui/custom-emoji';
import { YouTubeVideo } from "@/components/ui/youtube-video";
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
  Smile,
  Youtube
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { OwnershipGuard } from '@/components/auth/OwnershipGuard';

// Interfaces
interface PostReaction {
  emoji: string;
  users: string[];
  count: number;
}

interface PostComment {
  id: string;
  user: {
    id?: string;
    name: string;
    avatar?: string;
    initials: string;
	cargo?: string; // Adicione cargo  
    department?: string; // Adicione departamento
  };
  content: string;
  timestamp: string;
  likes?: string[]; // ADICIONAR ESTA LINHA
  liked?: boolean;  // ADICIONAR ESTA LINHA
}

interface Post {
  id: string;
  user: {
    id?: string;
    name: string;
    avatar?: string;
    initials: string;
	cargo?: string; // Adicione cargo
    department?: string; // Adicione departamento
  };
  content: string;
  images?: string[];
  video?: string;
  timestamp: string;
  likes: number;
  reactions?: PostReaction[];
  comments: PostComment[];
  liked: boolean;
  event?: {
    title: string;
    date: string;
    location: string;
  };
}

// Funções utilitárias
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

// Componente para renderização de imagens
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

// Função para determinar o tipo de arquivo
const getFileType = (url: string): 'image' | 'video' | 'youtube' | 'unknown' => {
  if (!url) return 'unknown';
  
  // Verificar se é URL do YouTube primeiro
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  // Se tem extensão, verificar por extensão
  const hasExtension = url.includes('.');
  if (hasExtension) {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return 'image';
    } else if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv'].includes(extension || '')) {
      return 'video';
    }
  }
  
  // Se não tem extensão mas parece ser um caminho de upload, assumir como imagem
  if (url.includes('/uploads/timeline/') && !url.includes('youtube')) {
    return 'image';
  }
  
  return 'unknown';
};

// Componente HomePage Unificada
const Home = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  
  // Estados da página
  const [posts, setPosts] = useState<Post[]>([]);
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
  const [departamentoVisibilidade, setDepartamentoVisibilidade] = useState(['TODOS']);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  
  //Estados paginação
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Refs para inputs de arquivo
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Função para buscar os posts

const fetchPosts = async (page = 1, append = false) => {
  try {
    const data = await api.get(`/timeline?page=${page}&limit=10`);
    
    // Como @/services/api retorna o JSON completo, data já é o objeto correto
    console.log('Resposta completa da API:', data);
    
    // CORREÇÃO: Verificar se a resposta tem a estrutura correta
    if (data && data.posts && Array.isArray(data.posts)) {
      // Resto da função permanece igual...
      const userId = localStorage.getItem('userId');
      
      const formattedPosts = data.posts.map(post => {
        console.log(`Post ${post._id}:`, {
          text: post.text ? post.text.substring(0, 30) : "Sem texto",
          hasAttachments: !!(post.attachments && post.attachments.length > 0),
          hasEventData: !!post.eventData,
          hasEvent: !!post.event,
          eventData: post.eventData,
          event: post.event
        });

        const formattedPost = {
          id: post._id,
          user: {
            id: post.user?._id,
            name: post.user?.nome || 'Usuário',
            avatar: post.user?.avatar,
            cargo: post.user?.cargo,
            department: post.user?.departamento,
            initials: post.user?.nome ? getInitials(post.user.nome) : 'U'
          },
          content: post.text || "",
          timestamp: formatTimestamp(post.createdAt),
          likes: post.likes?.length || 0,
          reactions: post.reactions || [],
          comments: (post.comments || []).map(comment => ({
            id: comment._id,
            user: {
              id: comment.user._id,
              name: comment.user.nome,
              avatar: comment.user.avatar,
              cargo: comment.user.cargo,
              department: comment.user.departamento
            },
            content: comment.text || comment.content,
            timestamp: formatTimestamp(comment.createdAt),
            likes: comment.likes?.length || 0,
            liked: comment.likes?.includes(userId) || false
          })),
          liked: post.likes?.includes(userId) || false,
          images: [],
          event: null as any
        };

        // CORREÇÃO: Processar dados do evento ANTES das imagens
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

        // Processar YouTube
        let processedImages = [];
        let cleanContent = formattedPost.content;

        const youtubeMatch = cleanContent.match(/\[YOUTUBE:(.*?)\]/);
        if (youtubeMatch) {
          processedImages.push(youtubeMatch[1]);
          cleanContent = cleanContent.replace(/\[YOUTUBE:.*?\]/, '').trim();
          formattedPost.content = cleanContent;
        }

        // Processar imagens/anexos existentes
        if (post.attachments && post.attachments.length > 0) {
          const attachments = post.attachments
            .filter(attachment => attachment)
            .map(attachment => normalizePath(attachment));
          processedImages = [...processedImages, ...attachments];
        }

        formattedPost.images = processedImages;
        
        return formattedPost;
      });
      
      return {
        posts: formattedPosts,
        pagination: data.pagination
      };
    } 
    // FALLBACK: Se ainda vier no formato antigo (array direto)
    else if (Array.isArray(data)) {
      console.warn('Resposta no formato antigo (array direto), convertendo...');
      const userId = localStorage.getItem('userId');
      
      const formattedPosts = data.map(post => {
        const formattedPost = {
          id: post._id,
          user: {
            id: post.user?._id,
            name: post.user?.nome || 'Usuário',
            avatar: post.user?.avatar,
            cargo: post.user?.cargo,
            department: post.user?.departamento,
            initials: post.user?.nome ? getInitials(post.user.nome) : 'U'
          },
          content: post.text || "",
          timestamp: formatTimestamp(post.createdAt),
          likes: post.likes?.length || 0,
          reactions: post.reactions || [],
          comments: (post.comments || []).map(comment => ({
            id: comment._id,
            user: {
              id: comment.user._id,
              name: comment.user.nome,
              avatar: comment.user.avatar,
              cargo: comment.user.cargo,
              department: comment.user.departamento
            },
            content: comment.text || comment.content,
            timestamp: formatTimestamp(comment.createdAt),
            likes: comment.likes?.length || 0,
            liked: comment.likes?.includes(userId) || false
          })),
          liked: post.likes?.includes(userId) || false,
          images: [],
          event: null as any
        };

        // CORREÇÃO: Processar dados do evento no formato antigo também
        if (post.eventData && typeof post.eventData === 'object') {
          console.log(`Post ${post._id} tem eventData (formato antigo):`, post.eventData);
          formattedPost.event = {
            title: post.eventData.title || '',
            date: post.eventData.date || '',
            location: post.eventData.location || ''
          };
        } else if (post.event && typeof post.event === 'object') {
          console.log(`Post ${post._id} tem event (formato antigo):`, post.event);
          formattedPost.event = post.event;
        }

        // Processar YouTube e anexos...
        let processedImages = [];
        let cleanContent = formattedPost.content;

        const youtubeMatch = cleanContent.match(/\[YOUTUBE:(.*?)\]/);
        if (youtubeMatch) {
          processedImages.push(youtubeMatch[1]);
          cleanContent = cleanContent.replace(/\[YOUTUBE:.*?\]/, '').trim();
          formattedPost.content = cleanContent;
        }

        if (post.attachments && post.attachments.length > 0) {
          const attachments = post.attachments
            .filter(attachment => attachment)
            .map(attachment => normalizePath(attachment));
          processedImages = [...processedImages, ...attachments];
        }

        formattedPost.images = processedImages;
        return formattedPost;
      });
      
      return {
        posts: formattedPosts,
        pagination: data.pagination
      };
    }
    else {
      console.error('Resposta da timeline não é um array nem objeto com posts:', data);
      return { posts: [], pagination: null };
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
	  eventData?: { title: string; date: string; location: string },
	  departamentoVisibilidade: string[] = ['TODOS'] 
	) => {
	  try {
		const formData = new FormData();
		
		// CORREÇÃO: Processar o conteúdo final antes de enviar
		let finalContent = text;
		if (youtubeUrl) {
		  // Adicionar marcador especial para YouTube
		  finalContent = text + (text ? '\n' : '') + `[YOUTUBE:${youtubeUrl}]`;
		}
		
		// Adicionar texto se existir
		if (finalContent) {
		  formData.append('text', finalContent);
		}
		
		// Adicionar departamentos à requisição
		formData.append('departamentoVisibilidade', JSON.stringify(departamentoVisibilidade));
		
		// Adicionar arquivos se existirem
		if (files.length > 0) {
		  files.forEach(file => {
			formData.append('attachments', file);
		  });
		}
		
		// Processar dados do evento
		if (eventData) {
		  formData.append('eventData', JSON.stringify(eventData));
		}
		
		const data = await api.upload('/timeline', formData);
		
		const formattedPost = {
		  id: data._id,
		  user: {
			id: data.user?._id || user?.id,
			name: data.user?.nome || user?.name || 'Você',
			avatar: data.user?.avatar || user?.avatar,
			cargo: data.user?.cargo || user?.cargo,
			department: data.user?.departamento || user?.department,
			initials: data.user?.nome ? getInitials(data.user.nome) : getInitials(user?.name || 'VC')
		  },
		  content: data.text || "",
		  timestamp: 'agora',
		  likes: data.likes?.length || 0,
		  reactions: data.reactions || [],
		  comments: [],
		  liked: false,
		  images: [],
		  event: null as any
		};

		// CORREÇÃO: Processar YouTube no post recém-criado
		let processedImages = [];
		let cleanContent = formattedPost.content;

		// Verificar se tem marcador de YouTube no texto retornado
		const youtubeMatch = cleanContent.match(/\[YOUTUBE:(.*?)\]/);
		if (youtubeMatch) {
		  processedImages.push(youtubeMatch[1]);
		  cleanContent = cleanContent.replace(/\[YOUTUBE:.*?\]/, '').trim();
		  formattedPost.content = cleanContent;
		}
		
		// Processar imagens/anexos
		if (data.attachments && data.attachments.length > 0) {
		  const attachments = data.attachments
			.filter(att => att)
			.map(att => normalizePath(att));
		  processedImages = [...processedImages, ...attachments];
		}
		
		formattedPost.images = processedImages;
		
		// Processar dados do evento
		if (data.eventData || data.event) {
		  try {
			if (data.event) {
			  formattedPost.event = data.event;
			} else if (data.eventData) {
			  const eventInfo = typeof data.eventData === 'string' 
				? JSON.parse(data.eventData)
				: data.eventData;
				
			  formattedPost.event = {
				title: eventInfo.title || '',
				date: eventInfo.date || '',
				location: eventInfo.location || ''
			  };
			}
		  } catch (e) {
			console.error('Erro ao processar dados do evento na resposta:', e);
		  }
		} else if (eventData) {
		  formattedPost.event = eventData;
		}
		
		return formattedPost;
	  } catch (error) {
		console.error('Erro ao criar post:', error);
		throw new Error('Não foi possível criar a publicação');
	  }
	};
  
  // Função para curtir um post
  const toggleLikePost = async (postId: string) => {
    try {
      const updatedLikes = await api.put(`/timeline/${postId}/like`);
      return updatedLikes;
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      throw new Error('Não foi possível curtir a publicação');
    }
  };
  
  // Função para adicionar comentário
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
  
  // Função para excluir um post
  const deletePost = async (postId: string) => {
    if (!localStorage.getItem('token')) {
      console.error('Token não encontrado');
      navigate('/login');
      return;
    }

    try {
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
                  
                  try {
                    await api.deletePost(postId);
                    
                    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
                    
                    toast({ 
                      title: "Sucesso", 
                      description: "Publicação excluída com sucesso." 
                    });
                  } catch (error) {
                    console.error('Erro na exclusão do post:', error);
                    
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
  
  // Carregar posts quando o componente montar
useEffect(() => {
  const loadPosts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token não encontrado');
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { posts: fetchedPosts, pagination: paginationData } = await fetchPosts(1);
      setPosts(fetchedPosts);
      setPagination(paginationData);
      setCurrentPage(1);
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
}, [navigate]);

// Função para carregar mais posts
const loadMorePosts = async () => {
  if (!pagination?.hasNext || loadingMore) return;
  
  setLoadingMore(true);
  
  try {
    const nextPage = currentPage + 1;
    const { posts: newPosts, pagination: newPagination } = await fetchPosts(nextPage);
    
    setPosts(prevPosts => [...prevPosts, ...newPosts]);
    setPagination(newPagination);
    setCurrentPage(nextPage);
    
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível carregar mais posts.",
      variant: "destructive"
    });
  } finally {
    setLoadingMore(false);
  }
};
  
  // Manipuladores de eventos
  const handleLike = async (postId: string) => {
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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
  
  const handleAddReaction = async (postId: string, emojiId: string) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Token não encontrado');
    navigate('/login');
    return;
  }

  try {
    const userId = localStorage.getItem('userId');
    
    // Atualizar otimisticamente
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const currentReactions = post.reactions || [];
        let updatedReactions = [...currentReactions];
        
        // Remover reações anteriores do usuário
        updatedReactions = updatedReactions.map(reaction => ({
          ...reaction,
          users: reaction.users.filter(id => id !== userId),
          count: reaction.users.filter(id => id !== userId).length
        })).filter(reaction => reaction.count > 0);
        
        // Adicionar nova reação ou incrementar existente
        const existingReactionIndex = updatedReactions.findIndex(r => r.emoji === emojiId);
        if (existingReactionIndex !== -1) {
          updatedReactions[existingReactionIndex].users.push(userId);
          updatedReactions[existingReactionIndex].count++;
        } else {
          updatedReactions.push({
            emoji: emojiId, // Agora usa o ID do emoji personalizado
            users: [userId],
            count: 1
          });
        }
        
        return { ...post, reactions: updatedReactions };
      }
      return post;
    }));

    // Fazer a requisição para o backend
    const response = await api.put(`/timeline/${postId}/reaction`, { emoji: emojiId });
    
    // Atualizar com os dados reais do servidor
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return { ...post, reactions: response };
      }
      return post;
    }));

  } catch (error) {
    console.error('Erro ao adicionar reação:', error);
    toast({ 
      title: "Erro", 
      description: "Não foi possível adicionar a reação.",
      variant: "destructive" 
    });
  }
};
  
  // Adicione esta função para curtir comentários
const handleLikeComment = async (postId: string, commentId: string) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Token não encontrado');
    navigate('/login');
    return;
  }

  try {
    const userId = localStorage.getItem('userId');
    
    // Atualizar otimisticamente
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const updatedComments = post.comments.map(comment => {
          if (comment.id === commentId) {
            const currentLikes = comment.likes || [];
            const isLiked = currentLikes.includes(userId);
            
            return {
              ...comment,
              likes: isLiked 
                ? currentLikes.filter(id => id !== userId)
                : [...currentLikes, userId],
              liked: !isLiked
            };
          }
          return comment;
        });
        
        return { ...post, comments: updatedComments };
      }
      return post;
    }));

    // Fazer a requisição para o backend
    const response = await api.put(`/timeline/${postId}/comment/${commentId}/like`);
    
    // Atualizar com os dados reais do servidor
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const formattedComments = response.comments.map(comment => ({
          id: comment._id,
          user: {
            id: comment.user?._id,
            name: comment.user?.nome || 'Usuário',
            avatar: comment.user?.avatar,
            cargo: comment.user?.cargo,
            department: comment.user?.departamento,
            initials: getInitials(comment.user?.nome || 'Usuário')
          },
          content: comment.text,
          timestamp: formatTimestamp(comment.createdAt),
          likes: comment.likes || [],
          liked: comment.likes?.includes(userId) || false
        }));
        
        return { ...post, comments: formattedComments };
      }
      return post;
    }));

  } catch (error) {
    console.error('Erro ao curtir comentário:', error);
    
    // Reverter mudança otimística em caso de erro
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const revertedComments = post.comments.map(comment => {
          if (comment.id === commentId) {
            const userId = localStorage.getItem('userId');
            const currentLikes = comment.likes || [];
            const wasLiked = currentLikes.includes(userId);
            
            return {
              ...comment,
              likes: wasLiked 
                ? [...currentLikes, userId]
                : currentLikes.filter(id => id !== userId),
              liked: wasLiked
            };
          }
          return comment;
        });
        
        return { ...post, comments: revertedComments };
      }
      return post;
    }));

    toast({ 
      title: "Erro", 
      description: "Não foi possível curtir o comentário.",
      variant: "destructive" 
    });
  }
};


// Nova função para excluir comentários
const handleDeleteComment = async (postId: string, commentId: string) => {
  if (!confirm('Tem certeza que deseja excluir este comentário?')) {
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Token não encontrado');
    navigate('/login');
    return;
  }

  try {
    // Fazer a requisição para o backend
    const response = await api.delete(`/timeline/${postId}/comment/${commentId}`);
    
    // Atualizar com os dados reais do servidor
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const formattedComments = response.comments.map(comment => ({
          id: comment._id,
          user: {
            id: comment.user?._id,
            name: comment.user?.nome || 'Usuário',
            avatar: comment.user?.avatar,
            cargo: comment.user?.cargo,
            department: comment.user?.departamento,
            initials: getInitials(comment.user?.nome || 'Usuário')
          },
          content: comment.text,
          timestamp: formatTimestamp(comment.createdAt),
          likes: comment.likes || [],
          liked: comment.likes?.includes(localStorage.getItem('userId')) || false
        }));
        
        return { ...post, comments: formattedComments };
      }
      return post;
    }));

    toast({ 
      title: "Sucesso", 
      description: "Comentário excluído com sucesso." 
    });

  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    toast({ 
      title: "Erro", 
      description: "Não foi possível excluir o comentário. Verifique suas permissões.",
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

  const filteredPosts = (() => {
  switch (activeTab) {
		case "todos":
		  return posts;
		case "fotos":
		  return posts.filter(post => {
			// Verificar se tem imagens que NÃO são YouTube e NÃO são vídeos
			return post.images && post.images.length > 0 && 
				   post.images.some(img => {
					 const fileType = getFileType(img);
					 return fileType === 'image'; // Apenas imagens
				   });
		  });
		case "videos":
		  return posts.filter(post => {
			// Verificar se tem vídeo próprio OU YouTube
			if (post.video) return true; // Vídeo upload direto
			
			// Verificar se tem URL do YouTube nas imagens
			return post.images && post.images.length > 0 && 
				   post.images.some(img => {
					 const fileType = getFileType(img);
					 return fileType === 'video' || fileType === 'youtube';
				   });
		  });
		case "eventos":
		  return posts.filter(post => post.event && post.event.title);
		default:
		  return posts;
	  }
	})();
  
  const createNewPost = async () => {
    const token = localStorage.getItem('token');
	  if (!token) {
		console.error('Token não encontrado');
		navigate('/login');
		return;
	  }

	  // Verificar conteúdo mínimo para publicação
	  const hasContent = newPostContent.trim().length > 0;
	  const hasMedia = selectedImages.length > 0 || selectedVideo !== null || youtubeUrl !== "";
	  const hasEvent = showEventForm && eventTitle.trim() && eventLocation.trim() && eventDate;

	  if (!hasContent && !hasMedia && !hasEvent) {
		toast({
		  title: "Conteúdo vazio",
		  description: "Adicione um texto, mídia ou um evento para publicar.",
		  variant: "destructive"
		});
		return;
	  }
	  
	  // Validar URL do YouTube se fornecida
	  if (youtubeUrl && !youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
		toast({
		  title: "URL inválida",
		  description: "Por favor, insira uma URL válida do YouTube.",
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
		// CORREÇÃO: Preparar arquivos corretamente
		let files = selectedVideo ? [selectedVideo] : selectedImages;
		
		// Se for YouTube, não enviar arquivos
		if (youtubeUrl) {
		  files = [];
		}
		
		// Preparar dados do evento
		let eventData = undefined;
		if (showEventForm && eventDate) {
		  eventData = {
			title: eventTitle.trim(),
			date: format(eventDate, "d 'de' MMMM, yyyy", { locale: ptBR }),
			location: eventLocation.trim()
		  };
		}

		// Indicar que estamos processando
		toast({
		  title: "Enviando publicação",
		  description: "Aguarde enquanto processamos sua publicação..."
		});

		// CORREÇÃO: Passar o texto original, a função vai processar o YouTube
		const newPost = await createNewPostApi(newPostContent, files, eventData, departamentoVisibilidade);
		
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
		setDepartamentoVisibilidade(['TODOS']);
		setYoutubeUrl("");
	  } catch (error) {
		console.error('Erro ao enviar post:', error);
		toast({ 
		  title: "Erro", 
		  description: error instanceof Error ? error.message : "Não foi possível criar a publicação.",
		  variant: "destructive" 
		});
	  }
	};

  // src/pages/Home.tsx - PARTE 2: RENDERIZAÇÃO (JSX/HTML)
// Esta parte deve ser incluída após todo o código da Parte 1

  return (
    <Layout>
      <div className="space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8">
        {/* Banner carrossel */}
        <div className="mt-2">
          <CarouselBanner />
        </div>
        
        {/* Título da seção de timeline */}
        <div className="flex justify-between items-center mt-8">
          <div>
            <h2 className="text-xl font-bold">Atividades e Eventos</h2>
            <p className="text-muted-foreground">Compartilhe e acompanhe atualizações da empresa</p>
          </div>
          
          <div>
            <PermissionGuard 
              requiredPermission="timeline:create"
              fallback={<div className="text-sm text-muted-foreground">Você não tem permissão para criar publicações</div>}
            >
              <Dialog open={newPostDialog} onOpenChange={setNewPostDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#e60909] hover:bg-[#e60909]/90 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Publicação
                  </Button>
                </DialogTrigger>
                   <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
					  <DialogHeader>
						<DialogTitle>Criar Nova Publicação</DialogTitle>
						<DialogDescription>
						  Compartilhe novidades, eventos ou atualizações com a equipe.
						</DialogDescription>
					  </DialogHeader>
					  <div className="space-y-4 py-4">
						<div className="flex items-start space-x-3">
						  <UserAvatar size="md" />
						  <div className="flex-1">
							<p className="font-medium">Você</p>
							<div className="relative">
							  <Textarea 
								placeholder="O que você deseja compartilhar?" 
								className="mt-2 focus-visible:ring-[#e60909] resize-none pr-10"
								rows={4}
								value={newPostContent}
								onChange={(e) => setNewPostContent(e.target.value)}
							  />
							  <div className="absolute bottom-2 right-2">
								<EmojiPicker 
								  onEmojiSelect={(emoji) => {
									setNewPostContent(prev => prev + emoji);
								  }}
								/>
							  </div>
							</div>
							<DepartamentoSelector 
							  onChange={setDepartamentoVisibilidade}
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
							  enableModal={false}
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

						{youtubeUrl && (
						  <div className="mt-4 rounded-lg overflow-hidden relative">
							<YouTubeVideo 
							  url={youtubeUrl}
							  className="w-full"
							  showThumbnail={true}
							/>
							<Button 
							  variant="destructive" 
							  size="icon" 
							  className="absolute top-1 right-1 h-6 w-6 rounded-full z-10"
							  onClick={() => setYoutubeUrl("")}
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

						{/* Botões de ação reorganizados em grid responsivo */}
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
						  <input 
							type="file" 
							ref={imageInputRef}
							accept="image/*" 
							multiple 
							className="hidden" 
							onChange={handleImageSelect}
							disabled={!!selectedVideo || previewImages.length >= 4 || !!youtubeUrl}
						  />
						  <Button 
							variant="outline" 
							className="w-full"
							onClick={() => imageInputRef.current?.click()}
							disabled={!!selectedVideo || previewImages.length >= 4 || !!youtubeUrl}
						  >
							<ImageIcon className="mr-2 h-4 w-4" />
							{previewImages.length > 0 ? 
							  `${previewImages.length}/4` : 
							  "Fotos"
							}
						  </Button>
						  
						  <input 
							type="file" 
							ref={videoInputRef}
							accept="video/*" 
							className="hidden" 
							onChange={handleVideoSelect}
							disabled={previewImages.length > 0 || !!youtubeUrl}
						  />
						  <Button 
							variant="outline" 
							className="w-full"
							onClick={() => videoInputRef.current?.click()}
							disabled={previewImages.length > 0 || !!selectedVideo || !!youtubeUrl}
						  >
							<Film className="mr-2 h-4 w-4" />
							{selectedVideo ? "✓" : "Vídeo"}
						  </Button>
						  
						  <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
						  <DialogTrigger asChild>
							<Button 
							  variant="outline" 
							  className="w-full"
							  disabled={previewImages.length > 0 || !!selectedVideo || !!youtubeUrl}
							  onClick={() => setYoutubeDialogOpen(true)}
							>
							  <Youtube className="mr-2 h-4 w-4" />
							  {youtubeUrl ? "✓" : "YouTube"}
							</Button>
						  </DialogTrigger>
						  <DialogContent className="sm:max-w-md">
							<DialogHeader>
							  <DialogTitle>Adicionar vídeo do YouTube</DialogTitle>
							  <DialogDescription>
								Cole a URL completa do vídeo do YouTube
							  </DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
							  <Input
								placeholder="https://www.youtube.com/watch?v=..."
								value={youtubeUrl}
								onChange={(e) => setYoutubeUrl(e.target.value)}
							  />
							</div>
							<DialogFooter>
							  <Button 
								variant="outline" 
								onClick={() => {
								  setYoutubeUrl("");
								  setYoutubeDialogOpen(false);
								}}
							  >
								Cancelar
							  </Button>
							  <Button 
								onClick={() => {
								  if (youtubeUrl && (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be'))) {
									setSelectedImages([]);
									setPreviewImages([]);
									setSelectedVideo(null);
									setPreviewVideo(null);
									setYoutubeDialogOpen(false);
								  } else {
									toast({
									  title: "URL inválida",
									  description: "Por favor, insira uma URL válida do YouTube",
									  variant: "destructive"
									});
								  }
								}}
							  >
								Adicionar
							  </Button>
							</DialogFooter>
						  </DialogContent>
						</Dialog>
						  
						  <Button 
							variant="outline" 
							className={cn(
							  "w-full",
							  showEventForm && "bg-gray-100 dark:bg-gray-700"
							)}
							onClick={toggleEventForm}
						  >
							<Calendar className="mr-2 h-4 w-4" />
							{showEventForm ? "Cancelar" : "Evento"}
						  </Button>
						</div>
					  </div>
					  
					  <DialogFooter className="mt-6">
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
							setYoutubeUrl("");
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
        
        {/* Conteúdo principal em grid: Timeline à esquerda e Calendário à direita */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
          {/* Coluna da Timeline (ocupa 2/3 do espaço em desktop) */}
          <div className="xl:col-span-2">
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
                            <UserAvatar 
							  user={{
								id: post.user.id,  // IMPORTANTE: Incluir o ID
								name: post.user.name,
								avatar: post.user.avatar,
								cargo: post.user.cargo,
								department: post.user.department
							  }}
							  showAttributes={false}
							  size="md"
							  enableModal={true}
							/>
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
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <LinkifiedText text={post.content} className="mb-4 whitespace-pre-line" />
                        
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
								  ) : fileType === 'youtube' ? (
									<YouTubeVideo 
									  url={img} 
									  className="w-full h-full"
									  showThumbnail={true}
									/>
                                  ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
                                      <span className="text-gray-500">Anexo não suportado</span>
                                    </div>
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
                      </CardContent>
                      <CardFooter className="flex flex-col space-y-4">
					  {/* Seção de Reações - NOVA */}
					  {post.reactions && post.reactions.length > 0 && (
						<div className="w-full">
						  <div className="flex flex-wrap gap-2 mb-2">
							{post.reactions.map((reaction, index) => {
							  const userId = localStorage.getItem('userId');
							  const userReacted = reaction.users.includes(userId);
							  
							  return (
								<button
								  key={index}
								  className={cn(
									"flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all duration-200",
									userReacted 
									  ? "bg-[#e60909]/10 border-[#e60909] text-[#e60909] shadow-sm" 
									  : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
								  )}
								  onClick={() => handleAddReaction(post.id, reaction.emoji)}
								  title={`${reaction.count} pessoa${reaction.count !== 1 ? 's' : ''} reagiu${reaction.count !== 1 ? 'ram' : ''}`}
								>
								  <CustomEmojiDisplay 
									emojiId={reaction.emoji} 
									size="sm" 
								  />
								  <span className="text-xs font-medium">{reaction.count}</span>
								</button>
							  );
							})}
						  </div>
						</div>
					  )}

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
						
						{/* Botão de Reações - NOVO */}
						<PermissionGuard requiredPermission="timeline:react">
						  <ReactionPicker onReactionSelect={(emojiId) => handleAddReaction(post.id, emojiId)} />
						</PermissionGuard>
					  </div>
					  
					  {post.comments.length > 0 && (
						<div className="space-y-3 w-full">
						  {post.comments.map((comment) => (
							<div key={comment.id} className="flex space-x-3">
							  <UserAvatar 
								  user={{
									id: comment.user.id,  // IMPORTANTE: Incluir o ID
									name: comment.user.name,
									avatar: comment.user.avatar,
									cargo: comment.user.cargo,
									department: comment.user.department
								  }}
								  showAttributes={false}
								  size="sm"
								  enableModal={true}
								/>
							  <div className="flex-1">
								<div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 px-3">
								  <div className="font-medium text-sm">{comment.user.name}</div>
								  <div className="text-sm">
									<LinkifiedText text={comment.content} />
								  </div>
								</div>
								<div className="flex text-xs text-gray-500 mt-1 ml-2 space-x-3">
								  <span>{comment.timestamp}</span>
								  <PermissionGuard requiredPermission="timeline:like_comment">
									<button 
									  className={`flex items-center gap-1 hover:text-[#e60909] ${comment.liked ? 'text-[#e60909] font-medium' : ''}`}
									  onClick={() => handleLikeComment(post.id, comment.id)}
									>
									  <Heart className={cn("h-3 w-3", comment.liked ? "fill-[#e60909]" : "")} />
									  {comment.likes?.length > 0 && comment.likes.length}
									</button>
								  </PermissionGuard>
								  <OwnershipGuard
									resourceOwnerId={comment.user.id}
									specialPermission="timeline:delete_any_comment"
								  >
									<button 
									  className="hover:text-red-500"
									  onClick={() => handleDeleteComment(post.id, comment.id)}
									>
									  Excluir
									</button>
								  </OwnershipGuard>
								</div>
							  </div>
							</div>
						  ))}
						</div>
					  )}
					  
					  <PermissionGuard requiredPermission="timeline:comment">
						<div className="flex space-x-3 w-full">
						  <UserAvatar size="sm" />
						  <div className="flex-1 flex relative">
							<EmojiInput
							  value={commentInput[post.id] || ''}
							  onChange={(value) => setCommentInput({
								...commentInput,
								[post.id]: value
							  })}
							  onKeyDown={(e) => {
								if (e.key === 'Enter') {
								  handleComment(post.id);
								}
							  }}
							  placeholder="Escreva um comentário..."
							  className="rounded-r-none focus-visible:ring-0 border-r-0 pr-10"
							/>
							<div className="absolute right-20 top-1/2 -translate-y-1/2 z-10">
							  <EmojiPicker 
								onEmojiSelect={(emoji) => {
								  const currentValue = commentInput[post.id] || '';
								  setCommentInput({
									...commentInput,
									[post.id]: currentValue + emoji
								  });
								}}
							  />
							</div>
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
				{/* Botão Carregar Mais */}
				{pagination?.hasNext && (
				  <div className="text-center mt-6">
					<Button
					  onClick={loadMorePosts}
					  disabled={loadingMore}
					  variant="outline"
					  className="min-w-[200px]"
					>
					  {loadingMore ? (
						<>
						  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#e60909] mr-2"></div>
						  Carregando...
						</>
					  ) : (
						`Carregar mais (${pagination.total - posts.length} restantes)`
					  )}
					</Button>
				  </div>
				)}
              </TabsContent>
              <TabsContent value="fotos" className="space-y-6">
				  {filteredPosts.length > 0 ? (
					filteredPosts.map((post) => (
					  
                    <Card key={post.id} className="animate-fade-in">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex space-x-3">
                            <UserAvatar 
							  user={{
								name: post.user.name,
								avatar: post.user.avatar,
								cargo: post.user.cargo,
								department: post.user.department
							  }}
							  showAttributes={false}
							  size="md"
							  enableModal={true}
							/>
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
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <LinkifiedText text={post.content} className="mb-4 whitespace-pre-line" />
                        
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
								  ) : fileType === 'youtube' ? (
									<YouTubeVideo 
									  url={img} 
									  className="w-full h-full"
									  showThumbnail={true}
									/>
                                  ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
                                      <span className="text-gray-500">Anexo não suportado</span>
                                    </div>
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
                      </CardContent>
                      <CardFooter className="flex flex-col space-y-4">
					  {/* Seção de Reações - NOVA */}
					  {post.reactions && post.reactions.length > 0 && (
						<div className="w-full">
						  <div className="flex flex-wrap gap-2 mb-2">
							{post.reactions.map((reaction, index) => {
							  const userId = localStorage.getItem('userId');
							  const userReacted = reaction.users.includes(userId);
							  
							  return (
								<button
								  key={index}
								  className={cn(
									"flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all duration-200",
									userReacted 
									  ? "bg-[#e60909]/10 border-[#e60909] text-[#e60909] shadow-sm" 
									  : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
								  )}
								  onClick={() => handleAddReaction(post.id, reaction.emoji)}
								  title={`${reaction.count} pessoa${reaction.count !== 1 ? 's' : ''} reagiu${reaction.count !== 1 ? 'ram' : ''}`}
								>
								  <CustomEmojiDisplay 
									emojiId={reaction.emoji} 
									size="sm" 
								  />
								  <span className="text-xs font-medium">{reaction.count}</span>
								</button>
							  );
							})}
						  </div>
						</div>
					  )}

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
						
						{/* Botão de Reações - NOVO */}
						<PermissionGuard requiredPermission="timeline:react">
						  <ReactionPicker onReactionSelect={(emojiId) => handleAddReaction(post.id, emojiId)} />
						</PermissionGuard>
					  </div>
					  
					  {post.comments.length > 0 && (
						<div className="space-y-3 w-full">
						  {post.comments.map((comment) => (
							<div key={comment.id} className="flex space-x-3">
							  <UserAvatar 
								user={{
								  name: comment.user.name,
								  avatar: comment.user.avatar,
								  cargo: comment.user.cargo,
								  department: comment.user.department
								}}
								showAttributes={false}
								size="sm"
								enableModal={true}
							  />
							  <div className="flex-1">
								<div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 px-3">
								  <div className="font-medium text-sm">{comment.user.name}</div>
								  <div className="text-sm">
									<LinkifiedText text={comment.content} />
								  </div>
								</div>
								<div className="flex text-xs text-gray-500 mt-1 ml-2 space-x-3">
								  <span>{comment.timestamp}</span>
								  <PermissionGuard requiredPermission="timeline:like_comment">
									<button 
									  className={`flex items-center gap-1 hover:text-[#e60909] ${comment.liked ? 'text-[#e60909] font-medium' : ''}`}
									  onClick={() => handleLikeComment(post.id, comment.id)}
									>
									  <Heart className={cn("h-3 w-3", comment.liked ? "fill-[#e60909]" : "")} />
									  {comment.likes?.length > 0 && comment.likes.length}
									</button>
								  </PermissionGuard>
								  <OwnershipGuard
									resourceOwnerId={comment.user.id}
									specialPermission="timeline:delete_any_comment"
								  >
									<button 
									  className="hover:text-red-500"
									  onClick={() => handleDeleteComment(post.id, comment.id)}
									>
									  Excluir
									</button>
								  </OwnershipGuard>
								</div>
							  </div>
							</div>
						  ))}
						</div>
					  )}
					  
					  <PermissionGuard requiredPermission="timeline:comment">
						<div className="flex space-x-3 w-full">
						  <UserAvatar size="sm" />
						  <div className="flex-1 flex relative">
							<EmojiInput
							  value={commentInput[post.id] || ''}
							  onChange={(value) => setCommentInput({
								...commentInput,
								[post.id]: value
							  })}
							  onKeyDown={(e) => {
								if (e.key === 'Enter') {
								  handleComment(post.id);
								}
							  }}
							  placeholder="Escreva um comentário..."
							  className="rounded-r-none focus-visible:ring-0 border-r-0 pr-10"
							/>
							<div className="absolute right-20 top-1/2 -translate-y-1/2 z-10">
							  <EmojiPicker 
								onEmojiSelect={(emoji) => {
								  const currentValue = commentInput[post.id] || '';
								  setCommentInput({
									...commentInput,
									[post.id]: currentValue + emoji
								  });
								}}
							  />
							</div>
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
						<ImageIcon className="h-10 w-10 text-gray-400" />
					  </div>
					  <h3 className="text-lg font-medium mt-4">Nenhuma foto encontrada</h3>
					  <p className="text-sm text-gray-500 mt-1">
						Ainda não há fotos compartilhadas
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
	            {/* Botão Carregar Mais */}
				{pagination?.hasNext && (
				  <div className="text-center mt-6">
					<Button
					  onClick={loadMorePosts}
					  disabled={loadingMore}
					  variant="outline"
					  className="min-w-[200px]"
					>
					  {loadingMore ? (
						<>
						  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#e60909] mr-2"></div>
						  Carregando...
						</>
					  ) : (
						`Carregar mais (${pagination.total - posts.length} restantes)`
					  )}
					</Button>
				  </div>
				)}
				</TabsContent>

				<TabsContent value="videos" className="space-y-6">
				  {filteredPosts.length > 0 ? (
					filteredPosts.map((post) => (
					  
                    <Card key={post.id} className="animate-fade-in">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex space-x-3">
                            <UserAvatar 
							  user={{
								name: post.user.name,
								avatar: post.user.avatar,
								cargo: post.user.cargo,
								department: post.user.department
							  }}
							  showAttributes={false}
							  size="md"
							  enableModal={true}
							/>
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
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <LinkifiedText text={post.content} className="mb-4 whitespace-pre-line" />
                        
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
								  ) : fileType === 'youtube' ? (
									<YouTubeVideo 
									  url={img} 
									  className="w-full h-full"
									  showThumbnail={true}
									/>
                                  ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
                                      <span className="text-gray-500">Anexo não suportado</span>
                                    </div>
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
                      </CardContent>
                      <CardFooter className="flex flex-col space-y-4">
					  {/* Seção de Reações - NOVA */}
					  {post.reactions && post.reactions.length > 0 && (
						<div className="w-full">
						  <div className="flex flex-wrap gap-2 mb-2">
							{post.reactions.map((reaction, index) => {
							  const userId = localStorage.getItem('userId');
							  const userReacted = reaction.users.includes(userId);
							  
							  return (
								<button
								  key={index}
								  className={cn(
									"flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all duration-200",
									userReacted 
									  ? "bg-[#e60909]/10 border-[#e60909] text-[#e60909] shadow-sm" 
									  : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
								  )}
								  onClick={() => handleAddReaction(post.id, reaction.emoji)}
								  title={`${reaction.count} pessoa${reaction.count !== 1 ? 's' : ''} reagiu${reaction.count !== 1 ? 'ram' : ''}`}
								>
								  <CustomEmojiDisplay 
									emojiId={reaction.emoji} 
									size="sm" 
								  />
								  <span className="text-xs font-medium">{reaction.count}</span>
								</button>
							  );
							})}
						  </div>
						</div>
					  )}

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
						
						{/* Botão de Reações - NOVO */}
						<PermissionGuard requiredPermission="timeline:react">
						  <ReactionPicker onReactionSelect={(emojiId) => handleAddReaction(post.id, emojiId)} />
						</PermissionGuard>
					  </div>
					  
					  {post.comments.length > 0 && (
						<div className="space-y-3 w-full">
						  {post.comments.map((comment) => (
							<div key={comment.id} className="flex space-x-3">
							  <UserAvatar 
								user={{
								  name: comment.user.name,
								  avatar: comment.user.avatar,
								  cargo: comment.user.cargo,
								  department: comment.user.department
								}}
								showAttributes={false}
								size="sm"
								enableModal={true}
							  />
							  <div className="flex-1">
								<div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 px-3">
								  <div className="font-medium text-sm">{comment.user.name}</div>
								  <div className="text-sm">
									<LinkifiedText text={comment.content} />
								  </div>
								</div>
								<div className="flex text-xs text-gray-500 mt-1 ml-2 space-x-3">
								  <span>{comment.timestamp}</span>
								  <PermissionGuard requiredPermission="timeline:like_comment">
									<button 
									  className={`flex items-center gap-1 hover:text-[#e60909] ${comment.liked ? 'text-[#e60909] font-medium' : ''}`}
									  onClick={() => handleLikeComment(post.id, comment.id)}
									>
									  <Heart className={cn("h-3 w-3", comment.liked ? "fill-[#e60909]" : "")} />
									  {comment.likes?.length > 0 && comment.likes.length}
									</button>
								  </PermissionGuard>
								  <OwnershipGuard
									resourceOwnerId={comment.user.id}
									specialPermission="timeline:delete_any_comment"
								  >
									<button 
									  className="hover:text-red-500"
									  onClick={() => handleDeleteComment(post.id, comment.id)}
									>
									  Excluir
									</button>
								  </OwnershipGuard>
								</div>
							  </div>
							</div>
						  ))}
						</div>
					  )}
					  
					  <PermissionGuard requiredPermission="timeline:comment">
						<div className="flex space-x-3 w-full">
						  <UserAvatar size="sm" />
						  <div className="flex-1 flex relative">
							<EmojiInput
							  value={commentInput[post.id] || ''}
							  onChange={(value) => setCommentInput({
								...commentInput,
								[post.id]: value
							  })}
							  onKeyDown={(e) => {
								if (e.key === 'Enter') {
								  handleComment(post.id);
								}
							  }}
							  placeholder="Escreva um comentário..."
							  className="rounded-r-none focus-visible:ring-0 border-r-0 pr-10"
							/>
							<div className="absolute right-20 top-1/2 -translate-y-1/2 z-10">
							  <EmojiPicker 
								onEmojiSelect={(emoji) => {
								  const currentValue = commentInput[post.id] || '';
								  setCommentInput({
									...commentInput,
									[post.id]: currentValue + emoji
								  });
								}}
							  />
							</div>
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
						<Film className="h-10 w-10 text-gray-400" />
					  </div>
					  <h3 className="text-lg font-medium mt-4">Nenhum vídeo encontrado</h3>
					  <p className="text-sm text-gray-500 mt-1">
						Ainda não há vídeos compartilhados
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
				 {/* Botão Carregar Mais */}
				{pagination?.hasNext && (
				  <div className="text-center mt-6">
					<Button
					  onClick={loadMorePosts}
					  disabled={loadingMore}
					  variant="outline"
					  className="min-w-[200px]"
					>
					  {loadingMore ? (
						<>
						  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#e60909] mr-2"></div>
						  Carregando...
						</>
					  ) : (
						`Carregar mais (${pagination.total - posts.length} restantes)`
					  )}
					</Button>
				  </div>
				)}
				</TabsContent>

				<TabsContent value="eventos" className="space-y-6">
				  {filteredPosts.length > 0 ? (
					filteredPosts.map((post) => (
					  
                    <Card key={post.id} className="animate-fade-in">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex space-x-3">
                            <UserAvatar 
							  user={{
								name: post.user.name,
								avatar: post.user.avatar,
								cargo: post.user.cargo,
								department: post.user.department
							  }}
							  showAttributes={false}
							  size="md"
							  enableModal={true}
							/>
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
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <LinkifiedText text={post.content} className="mb-4 whitespace-pre-line" />
                        
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
								  ) : fileType === 'youtube' ? (
									<YouTubeVideo 
									  url={img} 
									  className="w-full h-full"
									  showThumbnail={true}
									/>
                                  ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
                                      <span className="text-gray-500">Anexo não suportado</span>
                                    </div>
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
                      </CardContent>
                      <CardFooter className="flex flex-col space-y-4">
					  {/* Seção de Reações - NOVA */}
					  {post.reactions && post.reactions.length > 0 && (
						<div className="w-full">
						  <div className="flex flex-wrap gap-2 mb-2">
							{post.reactions.map((reaction, index) => {
							  const userId = localStorage.getItem('userId');
							  const userReacted = reaction.users.includes(userId);
							  
							  return (
								<button
								  key={index}
								  className={cn(
									"flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all duration-200",
									userReacted 
									  ? "bg-[#e60909]/10 border-[#e60909] text-[#e60909] shadow-sm" 
									  : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
								  )}
								  onClick={() => handleAddReaction(post.id, reaction.emoji)}
								  title={`${reaction.count} pessoa${reaction.count !== 1 ? 's' : ''} reagiu${reaction.count !== 1 ? 'ram' : ''}`}
								>
								  <CustomEmojiDisplay 
									emojiId={reaction.emoji} 
									size="sm" 
								  />
								  <span className="text-xs font-medium">{reaction.count}</span>
								</button>
							  );
							})}
						  </div>
						</div>
					  )}

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
						
						{/* Botão de Reações - NOVO */}
						<PermissionGuard requiredPermission="timeline:react">
						  <ReactionPicker onReactionSelect={(emojiId) => handleAddReaction(post.id, emojiId)} />
						</PermissionGuard>
					  </div>
					  
					  {post.comments.length > 0 && (
						<div className="space-y-3 w-full">
						  {post.comments.map((comment) => (
							<div key={comment.id} className="flex space-x-3">
							  <UserAvatar 
								user={{
								  name: comment.user.name,
								  avatar: comment.user.avatar,
								  cargo: comment.user.cargo,
								  department: comment.user.department
								}}
								showAttributes={false}
								size="sm"
								enableModal={true}
							  />
							  <div className="flex-1">
								<div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 px-3">
								  <div className="font-medium text-sm">{comment.user.name}</div>
								  <div className="text-sm">
									<LinkifiedText text={comment.content} />
								  </div>
								</div>
								<div className="flex text-xs text-gray-500 mt-1 ml-2 space-x-3">
								  <span>{comment.timestamp}</span>
								  <PermissionGuard requiredPermission="timeline:like_comment">
									<button 
									  className={`flex items-center gap-1 hover:text-[#e60909] ${comment.liked ? 'text-[#e60909] font-medium' : ''}`}
									  onClick={() => handleLikeComment(post.id, comment.id)}
									>
									  <Heart className={cn("h-3 w-3", comment.liked ? "fill-[#e60909]" : "")} />
									  {comment.likes?.length > 0 && comment.likes.length}
									</button>
								  </PermissionGuard>
								  <OwnershipGuard
									resourceOwnerId={comment.user.id}
									specialPermission="timeline:delete_any_comment"
								  >
									<button 
									  className="hover:text-red-500"
									  onClick={() => handleDeleteComment(post.id, comment.id)}
									>
									  Excluir
									</button>
								  </OwnershipGuard>
								</div>
							  </div>
							</div>
						  ))}
						</div>
					  )}
					  
					  <PermissionGuard requiredPermission="timeline:comment">
						<div className="flex space-x-3 w-full">
						  <UserAvatar size="sm" />
						  <div className="flex-1 flex relative">
							<EmojiInput
							  value={commentInput[post.id] || ''}
							  onChange={(value) => setCommentInput({
								...commentInput,
								[post.id]: value
							  })}
							  onKeyDown={(e) => {
								if (e.key === 'Enter') {
								  handleComment(post.id);
								}
							  }}
							  placeholder="Escreva um comentário..."
							  className="rounded-r-none focus-visible:ring-0 border-r-0 pr-10"
							/>
							<div className="absolute right-20 top-1/2 -translate-y-1/2 z-10">
							  <EmojiPicker 
								onEmojiSelect={(emoji) => {
								  const currentValue = commentInput[post.id] || '';
								  setCommentInput({
									...commentInput,
									[post.id]: currentValue + emoji
								  });
								}}
							  />
							</div>
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
						<Calendar className="h-10 w-10 text-gray-400" />
					  </div>
					  <h3 className="text-lg font-medium mt-4">Nenhum evento encontrado</h3>
					  <p className="text-sm text-gray-500 mt-1">
						Ainda não há eventos compartilhados
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
				{/* Botão Carregar Mais */}
				{pagination?.hasNext && (
				  <div className="text-center mt-6">
					<Button
					  onClick={loadMorePosts}
					  disabled={loadingMore}
					  variant="outline"
					  className="min-w-[200px]"
					>
					  {loadingMore ? (
						<>
						  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#e60909] mr-2"></div>
						  Carregando...
						</>
					  ) : (
						`Carregar mais (${pagination.total - posts.length} restantes)`
					  )}
					</Button>
				  </div>
				)}
				</TabsContent>
            </Tabs>
          </div>
          <div className="space-y-6">
		  {/* Widget de Ranking de Engajamento */}
		  <div className="bg-white rounded-xl shadow-sm p-6">
              <EngagementRanking />
		  </div>	  
		  
		  {/* Widget de Aniversários */}
			  <AniversariosWidget />
		   
          {/* Widget de Super Coins */}
              <SuperCoinWidget />		   
			  
          {/* Calendário e Aniversários - Coluna da direita (1/3 do espaço) */}
			 {/* Widget do Calendário */}
			  <EnhancedCalendarWidget />
			 
			 
			  
			</div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;