// src/pages/Institutional.tsx - Versão Melhorada
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Image, 
  Film, 
  Youtube, 
  ExternalLink, 
  GripVertical,
  Upload,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

interface InstitutionalArea {
  _id: string;
  title: string;
  description?: string;
  layout: 'small' | 'large';
  attachmentType: 'image' | 'document' | 'video' | 'youtube';
  attachmentUrl: string;
  youtubeVideoId?: string;
  linkUrl?: string;
  linkType?: 'internal' | 'external';
  order: number;
  active: boolean;
}

export default function Institutional() {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  const [areas, setAreas] = useState<InstitutionalArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<InstitutionalArea | null>(null);
  const [uploading, setUploading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    layout: 'small' as 'small' | 'large',
    attachmentType: 'image' as 'image' | 'document' | 'video' | 'youtube',
    linkUrl: '',
    linkType: 'internal' as 'internal' | 'external',
    youtubeUrl: '',
    active: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  
  const canManage = hasPermission('institutional:manage');
  const canCreate = hasPermission('institutional:create');
  const canEdit = hasPermission('institutional:edit');
  const canDelete = hasPermission('institutional:delete');
  
  // Buscar áreas
  const fetchAreas = async () => {
    try {
      const endpoint = canManage ? '/institutional/all' : '/institutional';
      const data = await api.get(endpoint);
      setAreas(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Erro ao buscar áreas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as áreas institucionais",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAreas();
  }, []);
  
  // Resetar formulário
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      layout: 'small',
      attachmentType: 'image',
      linkUrl: '',
      linkType: 'internal',
      youtubeUrl: '',
      active: true
    });
    setSelectedFile(null);
    setFilePreview(null);
    setEditingArea(null);
  };
  
  // Função para lidar com mudança de arquivo
  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    
    if (file) {
      // Criar preview para imagens
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    } else {
      setFilePreview(null);
    }
  };
  
  // Função para lidar com drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      // Verificar tipo de arquivo baseado no attachmentType
      const validTypes = {
        'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'video': ['video/mp4', 'video/webm', 'video/ogg']
      };
      
      const acceptedTypes = validTypes[formData.attachmentType] || [];
      
      if (acceptedTypes.includes(file.type)) {
        handleFileChange(file);
        toast({
          title: "Arquivo selecionado",
          description: `${file.name} foi adicionado com sucesso`
        });
      } else {
        toast({
          title: "Tipo de arquivo inválido",
          description: `Este tipo de arquivo não é aceito para ${formData.attachmentType}`,
          variant: "destructive"
        });
      }
    }
  };
  
  // Abrir diálogo para editar
  const openEditDialog = (area: InstitutionalArea) => {
    setEditingArea(area);
    setFormData({
      title: area.title,
      description: area.description || '',
      layout: area.layout,
      attachmentType: area.attachmentType,
      linkUrl: area.linkUrl || '',
      linkType: area.linkType || 'internal',
      youtubeUrl: area.attachmentType === 'youtube' ? area.attachmentUrl : '',
      active: area.active
    });
    setDialogOpen(true);
  };
  
  // Salvar área (criar ou atualizar)
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.attachmentType !== 'youtube' && !selectedFile && !editingArea) {
      toast({
        title: "Erro",
        description: "O anexo é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.attachmentType === 'youtube' && !formData.youtubeUrl && !editingArea) {
      toast({
        title: "Erro",
        description: "A URL do YouTube é obrigatória",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('layout', formData.layout);
      formDataToSend.append('attachmentType', formData.attachmentType);
      
      if (formData.linkUrl) {
        formDataToSend.append('linkUrl', formData.linkUrl);
        formDataToSend.append('linkType', formData.linkType);
      }
      
      if (formData.attachmentType === 'youtube') {
        formDataToSend.append('youtubeUrl', formData.youtubeUrl);
      } else if (selectedFile) {
        formDataToSend.append('attachment', selectedFile);
      }
      
      if (editingArea) {
        formDataToSend.append('active', formData.active.toString());
        await api.uploadPut(`/institutional/${editingArea._id}`, formDataToSend);
        toast({
          title: "Sucesso",
          description: "Área atualizada com sucesso!"
        });
      } else {
        await api.upload('/institutional', formDataToSend);
        toast({
          title: "Sucesso",
          description: "Área criada com sucesso!"
        });
      }
      
      setDialogOpen(false);
      resetForm();
      fetchAreas();
    } catch (error) {
      console.error('Erro ao salvar área:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a área",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Excluir área
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta área?')) return;
    
    try {
      await api.delete(`/institutional/${id}`);
      toast({
        title: "Sucesso",
        description: "Área excluída com sucesso!"
      });
      fetchAreas();
    } catch (error) {
      console.error('Erro ao excluir área:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a área",
        variant: "destructive"
      });
    }
  };
  
  // Funções de drag and drop para reordenamento
  const handleDragStart = (e: React.DragEvent, areaId: string) => {
    setDraggedItem(areaId);
  };
  
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOver(null);
  };
  
  const handleAreaDragOver = (e: React.DragEvent, areaId: string) => {
    e.preventDefault();
    setDraggedOver(areaId);
  };
  
  const handleAreaDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      setDraggedOver(null);
      return;
    }
    
    try {
      const draggedArea = areas.find(a => a._id === draggedItem);
      const targetArea = areas.find(a => a._id === targetId);
      
      if (!draggedArea || !targetArea) return;
      
      // Trocar as ordens
      const newAreas = [...areas];
      const draggedIndex = newAreas.findIndex(a => a._id === draggedItem);
      const targetIndex = newAreas.findIndex(a => a._id === targetId);
      
      // Remover o item arrastado e inserir na nova posição
      const [removed] = newAreas.splice(draggedIndex, 1);
      newAreas.splice(targetIndex, 0, removed);
      
      // Atualizar as ordens
      const updatedAreas = newAreas.map((area, index) => ({
        ...area,
        order: index
      }));
      
      setAreas(updatedAreas);
      
      // Enviar para o servidor
      await api.put('/institutional/order/update', {
        areas: updatedAreas.map(a => ({ id: a._id, order: a.order }))
      });
      
      toast({
        title: "Sucesso",
        description: "Ordem das áreas atualizada!"
      });
    } catch (error) {
      console.error('Erro ao reordenar áreas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reordenar as áreas",
        variant: "destructive"
      });
      // Reverter mudanças
      fetchAreas();
    }
    
    setDraggedItem(null);
    setDraggedOver(null);
  };
  
  // Renderizar conteúdo baseado no tipo
  const renderContent = (area: InstitutionalArea) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (area.linkUrl) {
        if (area.linkType === 'external') {
          // Garantir que URLs externas tenham protocolo
          let url = area.linkUrl;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          // Para links internos, usar navigate do React Router
          // Isso preserva o estado de autenticação e o contexto da aplicação
          try {
            // Verificar se é uma rota válida da aplicação
            const isValidRoute = area.linkUrl.startsWith('/') || 
                                area.linkUrl.startsWith('#') ||
                                !area.linkUrl.includes('://');
                                
            if (isValidRoute) {
              navigate(area.linkUrl);
            } else {
              // Se não for uma rota válida, tratar como externa
              window.open(area.linkUrl, '_blank', 'noopener,noreferrer');
            }
          } catch (error) {
            console.error('Erro ao navegar:', error);
            toast({
              title: "Erro de Navegação",
              description: "Não foi possível acessar o link solicitado",
              variant: "destructive"
            });
          }
        }
      }
    };
    
    const content = (
      <div className={cn(
        "relative group w-full h-full",
        area.linkUrl && "cursor-pointer hover:opacity-90 transition-opacity"
      )} onClick={area.linkUrl ? handleClick : undefined}>
        {area.attachmentType === 'image' && (
          <img 
            src={area.attachmentUrl} 
            alt={area.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        
        {area.attachmentType === 'youtube' && area.youtubeVideoId && (
          <div className="relative w-full h-full group">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${area.youtubeVideoId}?rel=0&enablejsapi=1`}
              title={area.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            
            {/* Overlay para YouTube que só aparece quando não está reproduzindo */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                 style={{ padding: area.layout === 'small' ? '1.5rem' : '2rem' }}>  {/* ← AJUSTE do padding */}
              <h3 className={cn(
                "text-white font-semibold mb-2",
                area.layout === 'small' ? "text-lg" : "text-2xl"  // ← AJUSTE do título
              )}>{area.title}</h3>
              {area.description && (
                <p className={cn(
                  "text-white/90 leading-relaxed",
                  area.layout === 'small' ? "text-sm" : "text-base"  // ← AJUSTE da descrição
                )}>{area.description}</p>
              )}
            </div>
          </div>
        )}
        
        {area.attachmentType === 'video' && (
          <div className="relative w-full h-full group/video">
            <video 
              className="w-full h-full object-cover"
              controls
              src={area.attachmentUrl}
              preload="metadata"
            >
              Seu navegador não suporta vídeos.
            </video>
            
            {/* Overlay que desaparece rapidamente quando não está em hover */}
            <div 
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent opacity-0 group-hover/video:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
              style={{ 
                padding: area.layout === 'small' ? '1rem' : '1.5rem',
                maxHeight: '40%' // Limita a altura do overlay
              }}
            >
              <h3 className={cn(
                "text-white font-semibold mb-1 drop-shadow-lg",
                area.layout === 'small' ? "text-base" : "text-xl"
              )}>{area.title}</h3>
              {area.description && (
                <p className={cn(
                  "text-white/90 leading-relaxed drop-shadow-md line-clamp-2", // Limita a 2 linhas
                  area.layout === 'small' ? "text-xs" : "text-sm"
                )}>{area.description}</p>
              )}
            </div>
          </div>
        )}
        
        {area.attachmentType === 'document' && (
          <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Preview do documento como iframe (primeira página) */}
            {area.attachmentUrl.endsWith('.pdf') ? (
              <div className="w-full h-full flex flex-col">
                <iframe
                  src={`${area.attachmentUrl}#page=1&view=fitH&toolbar=0&navpanes=0&scrollbar=0`}
                  className="flex-1 w-full border-0 bg-white rounded-lg shadow-inner"
                  style={{ minHeight: area.layout === 'small' ? '350px' : '450px' }} // ← AJUSTE AQUI baseado no layout
                  title={area.title}
                />
                <div className="mt-4 text-center flex-shrink-0">
                  <h3 className={cn(
                    "font-medium mb-2",
                    area.layout === 'small' ? "text-lg" : "text-xl"  // ← AJUSTE do título baseado no tamanho
                  )}>{area.title}</h3>
                  {area.description && (
                    <p className={cn(
                      "text-gray-600 mb-3",
                      area.layout === 'small' ? "text-sm" : "text-base"  // ← AJUSTE da descrição
                    )}>{area.description}</p>
                  )}
                  <Button 
                    size={area.layout === 'small' ? "sm" : "default"}  // ← AJUSTE do botão
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(area.attachmentUrl, '_blank');
                    }}
                  >
                    <FileText className={cn(
                      "mr-2",
                      area.layout === 'small' ? "h-4 w-4" : "h-5 w-5"  // ← AJUSTE do ícone
                    )} />
                    Abrir Documento
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <FileText className={cn(
                  "text-gray-400 mb-6",
                  area.layout === 'small' ? "h-24 w-24" : "h-32 w-32"  // ← AJUSTE do ícone baseado no tamanho
                )} />
                <h3 className={cn(
                  "font-medium text-center mb-3",
                  area.layout === 'small' ? "text-xl" : "text-2xl"  // ← AJUSTE do título
                )}>{area.title}</h3>
                {area.description && (
                  <p className={cn(
                    "text-gray-600 text-center mb-6",
                    area.layout === 'small' ? "text-sm" : "text-base"  // ← AJUSTE da descrição
                  )}>{area.description}</p>
                )}
                <Button 
                  size={area.layout === 'small' ? "default" : "lg"}  // ← AJUSTE do botão
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(area.attachmentUrl, '_blank');
                  }}
                >
                  <FileText className={cn(
                    "mr-2",
                    area.layout === 'small' ? "h-4 w-4" : "h-5 w-5"  // ← AJUSTE do ícone
                  )} />
                  Visualizar Documento
                </Button>
              </>
            )}
          </div>
        )}
        
        {/* Overlay com título e descrição para imagens - com hover mais responsivo */}
        {area.attachmentType !== 'document' && area.attachmentType !== 'video' && area.attachmentType !== 'youtube' && (
          <div 
            className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
            style={{ 
              padding: area.layout === 'small' ? '1rem' : '1.5rem',
              maxHeight: '40%' // Limita a altura do overlay
            }}
          >
            <h3 className={cn(
              "text-white font-semibold mb-1 drop-shadow-lg",
              area.layout === 'small' ? "text-base" : "text-xl"
            )}>{area.title}</h3>
            {area.description && (
              <p className={cn(
                "text-white/90 leading-relaxed drop-shadow-md line-clamp-3", // Limita a 3 linhas para imagens
                area.layout === 'small' ? "text-xs" : "text-sm"
              )}>{area.description}</p>
            )}
          </div>
        )}
        
        {/* Indicador de link - mantido no canto superior direito */}
        {area.linkUrl && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
            <ExternalLink className="h-5 w-5 text-gray-700" />
          </div>
        )}
      </div>
    );
    
    return content;
  };
  
  // Obter ícone baseado no tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'video': return <Film className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      default: return null;
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Institucional</h1>
            <p className="text-muted-foreground">Conheça os valores e princípios da empresa</p>
          </div>
          {canCreate && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Área
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : areas.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhuma área institucional cadastrada</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {areas.filter(area => area.active || canManage).map((area) => (
              <Card 
                key={area._id} 
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  area.layout === 'large' && "col-span-2",
                  !area.active && "opacity-60",
                  canManage && "cursor-move",
                  draggedOver === area._id && "ring-2 ring-blue-500",
                  draggedItem === area._id && "opacity-50 scale-95"
                )}
                draggable={canManage}
                onDragStart={(e) => handleDragStart(e, area._id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleAreaDragOver(e, area._id)}
                onDrop={(e) => handleAreaDrop(e, area._id)}
              >
                {canManage && (
                  <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">{area.title}</span>
                      {getTypeIcon(area.attachmentType)}
                      {!area.active && <span className="text-xs text-red-500">(Inativo)</span>}
                    </div>
                    <div className="flex gap-1">
                      {canEdit && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(area);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(area._id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                <CardContent className={cn(
                  "p-0",
                  area.layout === 'small' ? "h-[500px]" : "h-[600px]"  // Aumentado: small=500px, large=600px
                )}>
                  {renderContent(area)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Diálogo de criação/edição */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setDialogOpen(open);
        }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingArea ? 'Editar Área' : 'Nova Área Institucional'}</DialogTitle>
              <DialogDescription>
                Preencha as informações para {editingArea ? 'atualizar' : 'criar'} a área institucional
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Vídeo Palavra do Presidente"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="layout">Layout *</Label>
                  <Select 
                    value={formData.layout} 
                    onValueChange={(value: 'small' | 'large') => setFormData({ ...formData, layout: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeno (1 coluna)</SelectItem>
                      <SelectItem value="large">Grande (2 colunas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional da área"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="attachmentType">Tipo de Anexo *</Label>
                <Select 
                  value={formData.attachmentType} 
                  onValueChange={(value: 'image' | 'document' | 'video' | 'youtube') => {
                    setFormData({ ...formData, attachmentType: value });
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="youtube">Vídeo do YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.attachmentType === 'youtube' ? (
                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl">URL do YouTube *</Label>
                  <Input
                    id="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole a URL completa do vídeo do YouTube
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Label>Arquivo *</Label>
                  
                  {/* Área de upload com drag and drop */}
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                      dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
                      selectedFile ? "border-green-500 bg-green-50" : ""
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {filePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={filePreview} 
                          alt="Preview" 
                          className="max-h-40 mx-auto rounded-lg shadow-md"
                        />
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm text-green-600 font-medium">
                            {selectedFile?.name}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFileChange(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : selectedFile ? (
                      <div className="space-y-4">
                        <div className="flex flex-col items-center">
                          {formData.attachmentType === 'document' ? (
                            <FileText className="h-16 w-16 text-green-600" />
                          ) : (
                            <Film className="h-16 w-16 text-green-600" />
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-green-600 font-medium">
                              {selectedFile.name}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFileChange(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-12 w-12 mx-auto text-gray-400" />
                        <div>
                          <p className="text-gray-600">
                            Arraste e solte o arquivo aqui ou{' '}
                            <label className="text-blue-600 hover:text-blue-500 cursor-pointer font-medium">
                              clique para selecionar
                              <input
                                type="file"
                                className="sr-only"
                                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                accept={
                                  formData.attachmentType === 'image' ? 'image/*' :
                                  formData.attachmentType === 'document' ? '.pdf,.doc,.docx' :
                                  'video/*'
                                }
                              />
                            </label>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.attachmentType === 'image' && 'JPG, PNG, GIF, WEBP até 10MB'}
                            {formData.attachmentType === 'document' && 'PDF, DOC, DOCX até 50MB'}
                            {formData.attachmentType === 'video' && 'MP4, WEBM, OGG até 100MB'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {editingArea && !selectedFile && (
                    <p className="text-xs text-muted-foreground text-center">
                      Deixe vazio para manter o arquivo atual
                    </p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkUrl">Link (opcional)</Label>
                  <Input
                    id="linkUrl"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="URL para redirecionamento"
                  />
                </div>
                
                {formData.linkUrl && (
                  <div className="space-y-2">
                    <Label htmlFor="linkType">Tipo de Link</Label>
                    <Select 
                      value={formData.linkType} 
                      onValueChange={(value: 'internal' | 'external') => setFormData({ ...formData, linkType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Interno</SelectItem>
                        <SelectItem value="external">Externo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {editingArea && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Área ativa</Label>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingArea ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}