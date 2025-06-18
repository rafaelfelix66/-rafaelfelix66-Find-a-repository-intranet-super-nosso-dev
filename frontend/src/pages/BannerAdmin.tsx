// frontend/src/pages/BannerAdmin.tsx
import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/services/api";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Image as ImageIcon,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import DepartamentoSelector from "@/components/timeline/DepartamentoSelector";

interface Banner {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const BannerAdmin = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);
  const [departamentoVisibilidade, setDepartamentoVisibilidade] = useState(['TODOS']);
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Verificar autenticação
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);
  
  // Carregar banners
  const fetchBanners = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/banners/all');
      if (Array.isArray(response)) {
        setBanners(response);
      }
    } catch (error) {
      setError('Não foi possível carregar os banners');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os banners.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBanners();
  }, []);
  
  // Limpar formulário
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLink("");
    setActive(true);
    setOrder(0);
    setImage(null);
    setPreviewImage(null);
    setCurrentBanner(null);
    setIsEditing(false);
  };
  
  // Criar/Editar banner
const handleSave = async () => {
  if (!title.trim() || !description.trim()) {
    toast({
      title: "Campos obrigatórios",
      description: "Preencha o título e a descrição do banner.",
      variant: "destructive"
    });
    return;
  }
  
  if (!image && !isEditing) {
    toast({
      title: "Imagem obrigatória",
      description: "Selecione uma imagem para o banner.",
      variant: "destructive"
    });
    return;
  }
  
  // Adicione logs para debug
  console.log("Image:", image);
  
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('link', link || '');
  formData.append('active', String(active));
  formData.append('order', String(order));
  formData.append('departamentoVisibilidade', JSON.stringify(departamentoVisibilidade));
  if (image) {
    console.log("Adicionando imagem:", image.name, image.type, image.size);
    formData.append('image', image);
    
    // Verificar conteúdo do FormData
    console.log("FormData contém image:", formData.has('image'));
  }
  
  try {
    let response;
    
    if (isEditing && currentBanner) {
      // Use upload para atualização também
      response = await api.uploadPut(`/banners/${currentBanner._id}`, formData);
      toast({
        title: "Banner atualizado",
        description: "O banner foi atualizado com sucesso!"
      });
    } else {
      // Use upload em vez de post
      response = await api.upload('/banners', formData);
      toast({
        title: "Banner criado",
        description: "O banner foi criado com sucesso!"
      });
    }
    
    fetchBanners();
    setDialogOpen(false);
    resetForm();
  } catch (error) {
    toast({
      title: "Erro",
      description: isEditing 
        ? "Não foi possível atualizar o banner." 
        : "Não foi possível criar o banner.",
      variant: "destructive"
    });
  }
};
  
  // Excluir banner
  const handleDelete = async (bannerId: string) => {
    if (!confirm("Tem certeza que deseja excluir este banner?")) return;
    
    try {
      await api.delete(`/banners/${bannerId}`);
      fetchBanners();
      toast({
        title: "Banner removido",
        description: "O banner foi removido com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o banner.",
        variant: "destructive"
      });
    }
  };
  
  // Editar banner existente
  const handleEdit = (banner: Banner) => {
    setCurrentBanner(banner);
    setTitle(banner.title);
    setDescription(banner.description);
    setLink(banner.link || "");
    setActive(banner.active);
    setOrder(banner.order);
    setPreviewImage(banner.imageUrl);
    setIsEditing(true);
    setDialogOpen(true);
  };
  
  // Alterar posição (order)
  const moveOrder = async (bannerId: string, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b._id === bannerId);
    if (currentIndex === -1) return;
    
    const currentBanner = banners[currentIndex];
    let targetBanner;
    
    if (direction === 'up') {
      if (currentIndex === 0) return;
      targetBanner = banners[currentIndex - 1];
    } else {
      if (currentIndex === banners.length - 1) return;
      targetBanner = banners[currentIndex + 1];
    }
    
    try {
      // Trocar ordens
      await api.put(`/banners/${currentBanner._id}`, { order: targetBanner.order });
      await api.put(`/banners/${targetBanner._id}`, { order: currentBanner.order });
      
      // Recarregar banners
      fetchBanners();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a ordem dos banners.",
        variant: "destructive"
      });
    }
  };
  
  // Handler para selecionar imagem
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    
    // Validar tamanho do arquivo
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar dimensões da imagem
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const idealRatio = 3; // 1200/400 = 3
      
      if (Math.abs(aspectRatio - idealRatio) > 0.5) {
        toast({
          title: "⚠️ Proporção não ideal",
          description: `Imagem atual: ${img.width}x${img.height} (proporção ${aspectRatio.toFixed(1)}:1). Para melhor resultado, use imagens com proporção 3:1 (ex: 1200x400px).`,
          variant: "default"
        });
      }
      
      setImage(file);
      setPreviewImage(URL.createObjectURL(file));
    };
    
    img.src = URL.createObjectURL(file);
  }
};
  
  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Banners</h1>
            <p className="text-muted-foreground">
              Configure os banners exibidos na página inicial
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-[#e60909] hover:bg-[#e60909]/90 text-white"
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Editar Banner" : "Novo Banner"}</DialogTitle>
                <DialogDescription>
                  {isEditing 
                    ? "Altere as informações do banner selecionado." 
                    : "Preencha as informações para criar um novo banner."}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Digite o título do banner"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Digite uma breve descrição"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="link">Link (opcional)</Label>
                    <Input
                      id="link"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="Ex: /arquivos, /timeline, https://..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="order">Ordem</Label>
                      <Input
                        id="order"
                        type="number"
                        min="0"
                        value={order}
                        onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
					  <DepartamentoSelector 
						onChange={setDepartamentoVisibilidade}
					  />
					</div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="active"
                        checked={active}
                        onCheckedChange={setActive}
                      />
                      <Label htmlFor="active">Banner ativo</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Imagem {!isEditing && "*"}</Label>
                    <div className="flex items-center space-x-4">
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 w-full h-36"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        {previewImage ? (
                          <div className="relative w-full h-full">
                            <img
                              src={previewImage}
                              alt="Preview"
                              className="object-contain w-full h-full"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-0 right-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImage(null);
                                setPreviewImage(null);
                              }}
                            >
                              Remover
                            </Button>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="h-10 w-10 text-gray-400" />
                            <div className="mt-2 text-sm text-gray-500">
                              Clique para selecionar uma imagem
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                              Formato: JPG, PNG, WebP (máx. 5MB)
                            </div>
							<div className="mt-1 text-xs text-blue-600 font-medium">
							  📏 Tamanho ideal: 1200x400 pixels (proporção 3:1)
							</div>
							<div className="mt-0.5 text-xs text-gray-400">
							  Imagens com essa proporção evitam cortes indesejados
							</div>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={imageInputRef}
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-[#e60909] hover:bg-[#e60909]/90 text-white"
                  onClick={handleSave}
                >
                  {isEditing ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Banners Cadastrados</CardTitle>
            <CardDescription>
              Os banners são exibidos em ordem crescente de acordo com o campo "Ordem"
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p>Carregando banners...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{error}</p>
                <Button
                  className="mt-4"
                  onClick={fetchBanners}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="mb-2">Nenhum banner cadastrado</p>
                <p className="text-sm">
                  Clique em "Novo Banner" para começar a personalizar sua página inicial
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Banner</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((banner) => (
                    <TableRow key={banner._id}>
                      <TableCell>
                        <div className="h-14 w-20 rounded overflow-hidden">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {banner.title.length > 30 
                              ? `${banner.title.substring(0, 30)}...` 
                              : banner.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {banner.description.length > 50
                              ? `${banner.description.substring(0, 50)}...`
                              : banner.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`px-2 py-1 rounded-full text-xs inline-block ${
                          banner.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {banner.active ? 'Ativo' : 'Inativo'}
                        </div>
                      </TableCell>
                      <TableCell>{banner.order}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(banner.updatedAt), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveOrder(banner._id, 'up')}
                            disabled={banners.indexOf(banner) === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveOrder(banner._id, 'down')}
                            disabled={banners.indexOf(banner) === banners.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(banner)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(banner._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              {banners.length} {banners.length === 1 ? 'banner' : 'banners'} encontrados
            </div>
            <Button
              variant="outline"
              onClick={fetchBanners}
            >
              Atualizar lista
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default BannerAdmin;