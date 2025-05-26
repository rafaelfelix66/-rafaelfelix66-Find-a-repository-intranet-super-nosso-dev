// src/pages/JobPositions.tsx
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
  X,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

interface JobPosition {
  _id: string;
  title: string;
  description?: string;
  layout: 'small' | 'large';
  attachmentType: 'image' | 'document' | 'video' | 'youtube';
  attachmentUrl: string;
  youtubeVideoId?: string;
  linkUrl?: string;
  linkType?: 'internal' | 'external';
  department: string;
  location: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryRange?: string;
  requirements?: string;
  benefits?: string;
  applicationDeadline?: string;
  contactEmail?: string;
  order: number;
  active: boolean;
}

export default function JobPositions() {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<JobPosition | null>(null);
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
    department: '',
    location: '',
    employmentType: 'full-time' as 'full-time' | 'part-time' | 'contract' | 'internship',
    salaryRange: '',
    requirements: '',
    benefits: '',
    applicationDeadline: '',
    contactEmail: '',
    active: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  
  const canManage = hasPermission('jobs:manage');
  const canCreate = hasPermission('jobs:create');
  const canEdit = hasPermission('jobs:edit');
  const canDelete = hasPermission('jobs:delete');
  
  // Mapeamento de tipos de emprego
  const employmentTypeLabels = {
    'full-time': 'Tempo Integral',
    'part-time': 'Meio Período',
    'contract': 'Contrato',
    'internship': 'Estágio'
  };
  
  // Buscar vagas
  const fetchPositions = async () => {
    try {
      const endpoint = canManage ? '/job-positions/all' : '/job-positions';
      const data = await api.get(endpoint);
      setPositions(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Erro ao buscar vagas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as vagas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPositions();
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
      department: '',
      location: '',
      employmentType: 'full-time',
      salaryRange: '',
      requirements: '',
      benefits: '',
      applicationDeadline: '',
      contactEmail: '',
      active: true
    });
    setSelectedFile(null);
    setFilePreview(null);
    setEditingPosition(null);
  };
  
  // Função para lidar com mudança de arquivo
  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    
    if (file) {
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
  const openEditDialog = (position: JobPosition) => {
    setEditingPosition(position);
    setFormData({
      title: position.title,
      description: position.description || '',
      layout: position.layout,
      attachmentType: position.attachmentType,
      linkUrl: position.linkUrl || '',
      linkType: position.linkType || 'internal',
      youtubeUrl: position.attachmentType === 'youtube' ? position.attachmentUrl : '',
      department: position.department,
      location: position.location,
      employmentType: position.employmentType,
      salaryRange: position.salaryRange || '',
      requirements: position.requirements || '',
      benefits: position.benefits || '',
      applicationDeadline: position.applicationDeadline ? position.applicationDeadline.split('T')[0] : '',
      contactEmail: position.contactEmail || '',
      active: position.active
    });
    setDialogOpen(true);
  };
  
  // Salvar vaga (criar ou atualizar)
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.department.trim()) {
      toast({
        title: "Erro",
        description: "O departamento é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.location.trim()) {
      toast({
        title: "Erro",
        description: "A localização é obrigatória",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.attachmentType !== 'youtube' && !selectedFile && !editingPosition) {
      toast({
        title: "Erro",
        description: "O anexo é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.attachmentType === 'youtube' && !formData.youtubeUrl && !editingPosition) {
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
      formDataToSend.append('department', formData.department);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('employmentType', formData.employmentType);
      formDataToSend.append('salaryRange', formData.salaryRange);
      formDataToSend.append('requirements', formData.requirements);
      formDataToSend.append('benefits', formData.benefits);
      formDataToSend.append('contactEmail', formData.contactEmail);
      
      if (formData.applicationDeadline) {
        formDataToSend.append('applicationDeadline', formData.applicationDeadline);
      }
      
      if (formData.linkUrl) {
        formDataToSend.append('linkUrl', formData.linkUrl);
        formDataToSend.append('linkType', formData.linkType);
      }
      
      if (formData.attachmentType === 'youtube') {
        formDataToSend.append('youtubeUrl', formData.youtubeUrl);
      } else if (selectedFile) {
        formDataToSend.append('attachment', selectedFile);
      }
      
      if (editingPosition) {
        formDataToSend.append('active', formData.active.toString());
        await api.uploadPut(`/job-positions/${editingPosition._id}`, formDataToSend);
        toast({
          title: "Sucesso",
          description: "Vaga atualizada com sucesso!"
        });
      } else {
        await api.upload('/job-positions', formDataToSend);
        toast({
          title: "Sucesso",
          description: "Vaga criada com sucesso!"
        });
      }
      
      setDialogOpen(false);
      resetForm();
      fetchPositions();
    } catch (error) {
      console.error('Erro ao salvar vaga:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a vaga",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Excluir vaga
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta vaga?')) return;
    
    try {
      await api.delete(`/job-positions/${id}`);
      toast({
        title: "Sucesso",
        description: "Vaga excluída com sucesso!"
      });
      fetchPositions();
    } catch (error) {
      console.error('Erro ao excluir vaga:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a vaga",
        variant: "destructive"
      });
    }
  };
  
  // Funções de drag and drop para reordenamento
  const handleDragStart = (e: React.DragEvent, positionId: string) => {
    setDraggedItem(positionId);
  };
  
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOver(null);
  };
  
  const handlePositionDragOver = (e: React.DragEvent, positionId: string) => {
    e.preventDefault();
    setDraggedOver(positionId);
  };
  
  const handlePositionDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      setDraggedOver(null);
      return;
    }
    
    try {
      const draggedPosition = positions.find(p => p._id === draggedItem);
      const targetPosition = positions.find(p => p._id === targetId);
      
      if (!draggedPosition || !targetPosition) return;
      
      const newPositions = [...positions];
      const draggedIndex = newPositions.findIndex(p => p._id === draggedItem);
      const targetIndex = newPositions.findIndex(p => p._id === targetId);
      
      const [removed] = newPositions.splice(draggedIndex, 1);
      newPositions.splice(targetIndex, 0, removed);
      
      const updatedPositions = newPositions.map((position, index) => ({
        ...position,
        order: index
      }));
      
      setPositions(updatedPositions);
      
      await api.put('/job-positions/order/update', {
        positions: updatedPositions.map(p => ({ id: p._id, order: p.order }))
      });
      
      toast({
        title: "Sucesso",
        description: "Ordem das vagas atualizada!"
      });
    } catch (error) {
      console.error('Erro ao reordenar vagas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reordenar as vagas",
        variant: "destructive"
      });
      fetchPositions();
    }
    
    setDraggedItem(null);
    setDraggedOver(null);
  };
  
  // Renderizar conteúdo baseado no tipo
  const renderContent = (position: JobPosition) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (position.linkUrl) {
        if (position.linkType === 'external') {
          let url = position.linkUrl;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          try {
            const isValidRoute = position.linkUrl.startsWith('/') || 
                                position.linkUrl.startsWith('#') ||
                                !position.linkUrl.includes('://');
                                
            if (isValidRoute) {
              navigate(position.linkUrl);
            } else {
              window.open(position.linkUrl, '_blank', 'noopener,noreferrer');
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
        position.linkUrl && "cursor-pointer hover:opacity-90 transition-opacity"
      )} onClick={position.linkUrl ? handleClick : undefined}>
        {position.attachmentType === 'image' && (
          <img 
            src={position.attachmentUrl} 
            alt={position.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        
        {position.attachmentType === 'youtube' && position.youtubeVideoId && (
          <div className="relative w-full h-full group">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${position.youtubeVideoId}?rel=0&enablejsapi=1`}
              title={position.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                 style={{ padding: position.layout === 'small' ? '1.5rem' : '2rem' }}>
              <h3 className={cn(
                "text-white font-semibold mb-2",
                position.layout === 'small' ? "text-lg" : "text-2xl"
              )}>{position.title}</h3>
              {position.description && (
                <p className={cn(
                  "text-white/90 leading-relaxed",
                  position.layout === 'small' ? "text-sm" : "text-base"
                )}>{position.description}</p>
              )}
            </div>
          </div>
        )}
        
        {position.attachmentType === 'video' && (
          <div className="relative w-full h-full group/video">
            <video 
              className="w-full h-full object-cover"
              controls
              src={position.attachmentUrl}
              preload="metadata"
            >
              Seu navegador não suporta vídeos.
            </video>
            
            <div 
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent opacity-0 group-hover/video:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
              style={{ 
                padding: position.layout === 'small' ? '1rem' : '1.5rem',
                maxHeight: '40%'
              }}
            >
              <h3 className={cn(
                "text-white font-semibold mb-1 drop-shadow-lg",
                position.layout === 'small' ? "text-base" : "text-xl"
              )}>{position.title}</h3>
              {position.description && (
                <p className={cn(
                  "text-white/90 leading-relaxed drop-shadow-md line-clamp-2",
                  position.layout === 'small' ? "text-xs" : "text-sm"
                )}>{position.description}</p>
              )}
            </div>
          </div>
        )}
        
        {position.attachmentType === 'document' && (
          <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            {position.attachmentUrl.endsWith('.pdf') ? (
              <div className="w-full h-full flex flex-col">
                <iframe
                  src={`${position.attachmentUrl}#page=1&view=fitH&toolbar=0&navpanes=0&scrollbar=0`}
                  className="flex-1 w-full border-0 bg-white rounded-lg shadow-inner"
                  style={{ minHeight: position.layout === 'small' ? '350px' : '450px' }}
                  title={position.title}
                />
                <div className="mt-4 text-center flex-shrink-0">
                  <h3 className={cn(
                    "font-medium mb-2",
                    position.layout === 'small' ? "text-lg" : "text-xl"
                  )}>{position.title}</h3>
                  
                  {/* Informações da vaga */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Briefcase className="h-4 w-4" />
                      <span>{position.department}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{position.location}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {employmentTypeLabels[position.employmentType]}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    size={position.layout === 'small' ? "sm" : "default"}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(position.attachmentUrl, '_blank');
                    }}
                  >
                    <FileText className={cn(
                      "mr-2",
                      position.layout === 'small' ? "h-4 w-4" : "h-5 w-5"
                    )} />
                    Ver Detalhes da Vaga
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <FileText className={cn(
                  "text-gray-400 mb-6",
                  position.layout === 'small' ? "h-24 w-24" : "h-32 w-32"
                )} />
                <h3 className={cn(
                  "font-medium text-center mb-3",
                  position.layout === 'small' ? "text-xl" : "text-2xl"
                )}>{position.title}</h3>
                
                {/* Informações da vaga */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Briefcase className="h-4 w-4" />
                    <span>{position.department}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{position.location}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {employmentTypeLabels[position.employmentType]}
                    </span>
                  </div>
                  {position.salaryRange && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>{position.salaryRange}</span>
                    </div>
                  )}
                </div>
                
                <Button 
                  size={position.layout === 'small' ? "default" : "lg"}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(position.attachmentUrl, '_blank');
                  }}
                >
                  <FileText className={cn(
                    "mr-2",
                    position.layout === 'small' ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  Ver Detalhes da Vaga
                </Button>
              </>
            )}
          </div>
        )}
        
        {/* Overlay com título e descrição para imagens */}
        {position.attachmentType !== 'document' && position.attachmentType !== 'video' && position.attachmentType !== 'youtube' && (
          <div 
            className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
            style={{ 
              padding: position.layout === 'small' ? '1rem' : '1.5rem',
              maxHeight: '40%'
            }}
          >
            <h3 className={cn(
              "text-white font-semibold mb-1 drop-shadow-lg",
              position.layout === 'small' ? "text-base" : "text-xl"
            )}>{position.title}</h3>
            
            {/* Informações da vaga no overlay */}
            <div className="space-y-1 mb-2">
              <div className="flex items-center gap-2 text-white/90 text-xs">
                <Briefcase className="h-3 w-3" />
                <span>{position.department}</span>
              </div>
              <div className="flex items-center gap-2 text-white/90 text-xs">
                <MapPin className="h-3 w-3" />
                <span>{position.location}</span>
              </div>
              <span className="inline-block px-2 py-1 bg-white/20 text-white rounded-full text-xs">
                {employmentTypeLabels[position.employmentType]}
              </span>
            </div>
            
            {position.description && (
              <p className={cn(
                "text-white/90 leading-relaxed drop-shadow-md line-clamp-3",
                position.layout === 'small' ? "text-xs" : "text-sm"
              )}>{position.description}</p>
            )}
          </div>
        )}
        
        {/* Indicador de link */}
        {position.linkUrl && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
            <ExternalLink className="h-5 w-5 text-gray-700" />
          </div>
        )}
        
        {/* Prazo de inscrição */}
        {position.applicationDeadline && (
          <div className="absolute bottom-4 left-4 bg-red-500/90 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-xs z-10">
            <Calendar className="h-3 w-3 inline mr-1" />
            Prazo: {new Date(position.applicationDeadline).toLocaleDateString('pt-BR')}
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
            <h1 className="text-2xl font-bold">Vagas de Trabalho</h1>
            <p className="text-muted-foreground">Oportunidades de carreira na empresa</p>
          </div>
          {canCreate && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Vaga
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : positions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhuma vaga cadastrada</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {positions.filter(position => position.active || canManage).map((position) => (
              <Card 
                key={position._id} 
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  position.layout === 'large' && "col-span-2",
                  !position.active && "opacity-60",
                  canManage && "cursor-move",
                  draggedOver === position._id && "ring-2 ring-blue-500",
                  draggedItem === position._id && "opacity-50 scale-95"
                )}
                draggable={canManage}
                onDragStart={(e) => handleDragStart(e, position._id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handlePositionDragOver(e, position._id)}
                onDrop={(e) => handlePositionDrop(e, position._id)}
              >
                {canManage && (
                  <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">{position.title}</span>
                      {getTypeIcon(position.attachmentType)}
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {position.department}
                      </span>
                      {!position.active && <span className="text-xs text-red-500">(Inativo)</span>}
                    </div>
                    <div className="flex gap-1">
                      {canEdit && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(position);
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
                            handleDelete(position._id);
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
                  position.layout === 'small' ? "h-[500px]" : "h-[600px]"
                )}>
                  {renderContent(position)}
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPosition ? 'Editar Vaga' : 'Nova Vaga de Trabalho'}</DialogTitle>
              <DialogDescription>
                Preencha as informações para {editingPosition ? 'atualizar' : 'criar'} a vaga
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Informações básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Vaga *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Desenvolvedor Frontend"
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
              
              {/* Informações específicas da vaga */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Ex: Tecnologia"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Localização *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Belo Horizonte - MG"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Tipo de Contratação *</Label>
                  <Select 
                    value={formData.employmentType} 
                    onValueChange={(value: 'full-time' | 'part-time' | 'contract' | 'internship') => 
                      setFormData({ ...formData, employmentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Tempo Integral</SelectItem>
                      <SelectItem value="part-time">Meio Período</SelectItem>
                      <SelectItem value="contract">Contrato</SelectItem>
                      <SelectItem value="internship">Estágio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salaryRange">Faixa Salarial</Label>
                  <Input
                    id="salaryRange"
                    value={formData.salaryRange}
                    onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                    placeholder="Ex: R$ 5.000 - R$ 8.000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicationDeadline">Prazo de Inscrição</Label>
                  <Input
                    id="applicationDeadline"
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email para Contato</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="rh@empresa.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição da Vaga</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição resumida da vaga"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requirements">Requisitos</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Liste os requisitos necessários para a vaga"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="benefits">Benefícios</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Liste os benefícios oferecidos"
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
                  
                  {editingPosition && !selectedFile && (
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
                    placeholder="URL para candidatura ou mais informações"
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
              
              {editingPosition && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Vaga ativa</Label>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPosition ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}