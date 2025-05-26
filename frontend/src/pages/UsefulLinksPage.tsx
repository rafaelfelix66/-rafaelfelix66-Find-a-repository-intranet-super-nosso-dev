// src/pages/UsefulLinksPage.tsx
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/usePermission';
import { api } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { 
  ExternalLink, 
  Plus, 
  Search, 
  Globe, 
  FileText, 
  Settings, 
  Database,
  Code,
  Users,
  Shield,
  Calendar,
  Mail,
  Phone,
  BookOpen,
  Calculator,
  Briefcase,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

// Mapeamento de ícones disponíveis
const iconMap = {
  ExternalLink,
  Globe,
  FileText,
  Settings,
  Database,
  Code,
  Users,
  Shield,
  Calendar,
  Mail,
  Phone,
  BookOpen,
  Calculator,
  Briefcase
};

// Interface para Link
interface UsefulLink {
  _id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  icon: string;
  order: number;
  isActive: boolean;
  createdBy: {
    _id: string;
    nome: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const UsefulLinksPage = () => {
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  
  // Estados
  const [groupedLinks, setGroupedLinks] = useState<Record<string, UsefulLink[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<UsefulLink | null>(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    category: 'Geral',
    icon: 'ExternalLink'
  });

  const isAdmin = hasPermission('useful_links:manage');

  // Buscar dados
  const fetchLinks = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/useful-links');
      setGroupedLinks(data);
      
      // Extrair categorias
      const cats = Object.keys(data).sort();
      setCategories(cats);
    } catch (error) {
      console.error('Erro ao buscar links:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os links úteis',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  // Filtrar links
  const getFilteredLinks = () => {
    let allLinks: UsefulLink[] = [];
    
    // Converter objeto agrupado em array
    Object.values(groupedLinks).forEach(categoryLinks => {
      allLinks = [...allLinks, ...categoryLinks];
    });

    // Aplicar filtros
    let filtered = allLinks;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(link => 
        link.title.toLowerCase().includes(term) ||
        link.description.toLowerCase().includes(term) ||
        link.category.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(link => link.category === selectedCategory);
    }

    // Reagrupar os links filtrados
    const regrouped: Record<string, UsefulLink[]> = {};
    filtered.forEach(link => {
      if (!regrouped[link.category]) {
        regrouped[link.category] = [];
      }
      regrouped[link.category].push(link);
    });

    // Ordenar dentro de cada categoria
    Object.keys(regrouped).forEach(category => {
      regrouped[category].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
    });

    return regrouped;
  };

  // Manipuladores de formulário
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.url) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingLink) {
        await api.put(`/useful-links/${editingLink._id}`, formData);
        toast({
          title: 'Sucesso',
          description: 'Link atualizado com sucesso'
        });
      } else {
        await api.post('/useful-links', formData);
        toast({
          title: 'Sucesso',
          description: 'Link criado com sucesso'
        });
      }
      
      setIsDialogOpen(false);
      setEditingLink(null);
      setFormData({
        title: '',
        description: '',
        url: '',
        category: 'Geral',
        icon: 'ExternalLink'
      });
      
      fetchLinks();
    } catch (error) {
      console.error('Erro ao salvar link:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o link',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (link: UsefulLink) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      description: link.description,
      url: link.url,
      category: link.category,
      icon: link.icon
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (link: UsefulLink) => {
    if (!confirm(`Tem certeza que deseja excluir o link "${link.title}"?`)) {
      return;
    }

    try {
      await api.delete(`/useful-links/${link._id}`);
      toast({
        title: 'Sucesso',
        description: 'Link excluído com sucesso'
      });
      fetchLinks();
    } catch (error) {
      console.error('Erro ao excluir link:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o link',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (link: UsefulLink) => {
    try {
      await api.put(`/useful-links/${link._id}`, {
        isActive: !link.isActive
      });
      toast({
        title: 'Sucesso',
        description: `Link ${link.isActive ? 'desativado' : 'ativado'} com sucesso`
      });
      fetchLinks();
    } catch (error) {
      console.error('Erro ao alterar status do link:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do link',
        variant: 'destructive'
      });
    }
  };

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const LinkCard = ({ link }: { link: UsefulLink }) => {
    const IconComponent = iconMap[link.icon as keyof typeof iconMap] || ExternalLink;
    
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-blue-500 hover:border-l-blue-600">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div 
              className="flex items-start space-x-3 flex-1"
              onClick={() => handleLinkClick(link.url)}
            >
              <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                <IconComponent className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {link.title}
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-gray-600 line-clamp-2">
                  {link.description}
                </CardDescription>
              </div>
            </div>
            
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(link)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleActive(link)}>
                    {link.isActive ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDelete(link)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div 
            className="flex items-center justify-between"
            onClick={() => handleLinkClick(link.url)}
          >
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {link.category}
              </Badge>
              {!link.isActive && isAdmin && (
                <Badge variant="destructive" className="text-xs">
                  Inativo
                </Badge>
              )}
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredLinks = getFilteredLinks();

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Links Úteis</h1>
            <p className="text-gray-600 mt-1">
              Acesse rapidamente ferramentas e recursos importantes
            </p>
          </div>
          
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Link
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingLink ? 'Editar Link' : 'Adicionar Novo Link'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os dados do link útil que será exibido para os usuários.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                        placeholder="Ex: Sistema de RH"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Descrição *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                        placeholder="Descreva o que este link oferece..."
                        rows={3}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="url">URL *</Label>
                      <Input
                        id="url"
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData(prev => ({...prev, url: e.target.value}))}
                        placeholder="https://exemplo.com"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Categoria</Label>
                        <Input
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
                          placeholder="Ex: Sistemas, Ferramentas"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="icon">Ícone</Label>
                        <Select 
                          value={formData.icon} 
                          onValueChange={(value) => setFormData(prev => ({...prev, icon: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(iconMap).map(iconName => {
                              const IconComponent = iconMap[iconName as keyof typeof iconMap];
                              return (
                                <SelectItem key={iconName} value={iconName}>
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    {iconName}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingLink(null);
                        setFormData({
                          title: '',
                          description: '',
                          url: '',
                          category: 'Geral',
                          icon: 'ExternalLink'
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingLink ? 'Atualizar' : 'Criar'} Link
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          /* Links Grid */
          <div className="space-y-8">
            {Object.keys(filteredLinks).length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Nenhum link encontrado' 
                    : 'Nenhum link cadastrado'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Links úteis aparecerão aqui quando forem adicionados'}
                </p>
                {isAdmin && !searchTerm && selectedCategory === 'all' && (
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar primeiro link
                  </Button>
                )}
              </div>
            ) : (
              Object.entries(filteredLinks)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, links]) => (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {category}
                      </h2>
                      <Badge variant="outline" className="text-xs">
                        {links.length} {links.length === 1 ? 'link' : 'links'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {links.map(link => (
                        <LinkCard key={link._id} link={link} />
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
        
        {/* Footer Info for Admins */}
        {isAdmin && Object.keys(filteredLinks).length > 0 && (
          <div className="mt-12 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Área Administrativa</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Você pode editar, reordenar ou excluir links usando o menu de ações em cada card. 
                  Links inativos só são visíveis para administradores.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UsefulLinksPage;