// src/pages/KnowledgeBase.tsx
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Import components and hooks
import { ArticleForm } from "@/features/knowledge-base/ArticleForm";
import { CategorySidebar } from "@/features/knowledge-base/CategorySidebar";
import { categories as initialCategories } from "@/features/knowledge-base/mock-data";
import { SearchBar } from "@/features/knowledge-base/components/SearchBar";
import { ArticleContent } from "@/features/knowledge-base/components/ArticleContent";
import { useArticles } from "@/features/knowledge-base/hooks/useArticles";
import { loadCategories, saveCategories, createCategory as createCategoryService } from "@/services/categoryService";
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { usePermission } from '@/hooks/usePermission';
// Interface para categorias gerenciáveis
interface CategoryWithStats {
  id: string;
  name: string;
  icon: JSX.Element;
  count: number;
  color: string;
}

const KnowledgeBase = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [categories, setCategories] = useState<CategoryWithStats[]>(initialCategories);
  // Garantindo que o diálogo comece fechado
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryToDelete, setSelectedCategoryToDelete] = useState<string | null>(null);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  
  // Hook de autenticação para verificar permissões diretamente
  const { user: currentUser } = useAuth(); // Renomeando para currentUser
  const { hasPermission } = usePermission(); // Obtendo a função hasPermission
  
  const {
    articles,
    selectedArticle,
    isCreatingArticle,
    newArticle,
    newTag,
    isLoading,
    error,
    setIsCreatingArticle,
    setNewArticle,
    setNewTag,
    handleArticleClick,
    handleCloseArticle,
    handleToggleFavorite,
    handleAddTag,
    handleRemoveTag,
    handleCreateArticle,
    handleDeleteArticle,
    fetchArticles
  } = useArticles();
  
  // Carregar categorias salvas do localStorage quando o componente é montado
  useEffect(() => {
    try {
      const savedCategories = loadCategories();
      if (savedCategories && savedCategories.length > 0) {
        // Manter o mesmo formato dos ícones que vêm das categorias iniciais
        const categoriesWithIcons = savedCategories.map(cat => ({
          ...cat,
          icon: initialCategories.find(c => c.id === cat.id)?.icon || initialCategories[0].icon
        }));
        setCategories(categoriesWithIcons);
      } else {
        // Se não houver categorias salvas, salvar as categorias iniciais
        saveCategories(initialCategories);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }, []);

  // Atualizar a contagem de artigos em cada categoria
  useEffect(() => {
    const updatedCategories = categories.map(category => {
      // Contar artigos nesta categoria
      const count = articles.filter(article => article.categoryId === category.id).length;
      return { ...category, count };
    });
    
    setCategories(updatedCategories);
  }, [articles]);
  
  // Salvar categorias no localStorage quando elas são alteradas
  useEffect(() => {
    try {
      // Usar o serviço para salvar categorias
      saveCategories(categories);
    } catch (error) {
      console.error('Erro ao salvar categorias:', error);
    }
  }, [categories]);
  
  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === "todos") return matchesSearch;
    if (activeTab === "favoritos") return matchesSearch && article.favorite;
    return matchesSearch && article.categoryId.toLowerCase() === activeTab.toLowerCase();
  });

  const handleCloseNewArticleDialog = () => {
    setIsCreatingArticle(false);
  };
  
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsSubmittingCategory(true);
    
    try {
      // Usar o serviço para criar a categoria
      const newCategory = await createCategoryService(
        newCategoryName,
        initialCategories[0].icon, // Usar o mesmo ícone da primeira categoria como padrão
        "blue-500" // Cor padrão
      );
      
      // Adicionar a nova categoria à lista
      setCategories([...categories, newCategory]);
      setNewCategoryName("");
      setIsAddCategoryOpen(false);
      
      toast({
        title: "Categoria criada",
        description: `A categoria "${newCategoryName}" foi criada com sucesso!`,
      });
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar categoria",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingCategory(false);
    }
  };
  
  const handleDeleteCategory = async () => {
    if (!selectedCategoryToDelete) return;
    
    setIsSubmittingCategory(true);
    
    try {
      // Verificar se existem artigos nesta categoria
      const hasArticles = articles.some(article => article.categoryId === selectedCategoryToDelete);
      
      if (hasArticles) {
        toast({
          title: "Não foi possível excluir",
          description: "Esta categoria contém artigos e não pode ser excluída.",
          variant: "destructive"
        });
        setIsDeleteCategoryOpen(false);
        setSelectedCategoryToDelete(null);
        setIsSubmittingCategory(false);
        return;
      }
      
      // Usar o serviço para excluir a categoria
      const deleteFromStorage = async () => {
        const updatedCategories = categories.filter(c => c.id !== selectedCategoryToDelete);
        setCategories(updatedCategories);
        // Atualizar explicitamente o localStorage para garantir a persistência
        saveCategories(updatedCategories);
      };
      
      await deleteFromStorage();
      
      // Se a categoria atual for excluída, voltar para "todos"
      if (activeTab === selectedCategoryToDelete) {
        setActiveTab("todos");
      }
      
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
      
      setIsDeleteCategoryOpen(false);
      setSelectedCategoryToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir categoria",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingCategory(false);
    }
  };
  
  const handleSearch = () => {
    // Esta função seria chamada quando o botão de busca for clicado
    console.log("Buscando por:", searchTerm);
    // A filtragem já está acontecendo no filteredArticles, então não precisamos
    // de implementação adicional aqui
  };

  // Verificar permissões para renderização condicional
  const canCreateArticle = hasPermission('knowledge:create');
  const canManageCategories = hasPermission('knowledge:manage_categories');
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Base de Conhecimento</h1>
            <p className="text-muted-foreground">
              Acesse artigos, manuais e documentações para consulta rápida
            </p>
          </div>
          
          <PermissionGuard requiredPermission="knowledge:create">
            <Button 
              onClick={() => setIsCreatingArticle(true)}
              className="bg-supernosso-red hover:bg-supernosso-red/90"
            >
              Novo Artigo
            </Button>
          </PermissionGuard>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar with Categories */}
          <div>
            <CategorySidebar 
              categories={categories}
              articleCount={articles.length}
              favoritesCount={articles.filter(a => a.favorite).length}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setIsCreatingArticle={(value) => {
                if (value && !canCreateArticle) {
                  toast({
                    title: "Permissão negada",
                    description: "Você não tem permissão para criar artigos",
                    variant: "destructive"
                  });
                  return;
                }
                setIsCreatingArticle(value);
              }}
              onAddCategory={() => {
                if (!canManageCategories) {
                  toast({
                    title: "Permissão negada",
                    description: "Você não tem permissão para gerenciar categorias",
                    variant: "destructive"
                  });
                  return;
                }
                setIsAddCategoryOpen(true);
              }}
              onDeleteCategory={(categoryId) => {
                if (!canManageCategories) {
                  toast({
                    title: "Permissão negada",
                    description: "Você não tem permissão para excluir categorias",
                    variant: "destructive"
                  });
                  return;
                }
                setSelectedCategoryToDelete(categoryId);
                setIsDeleteCategoryOpen(true);
              }}
              canManageCategories={canManageCategories}
            />
          </div>
          
          {/* Main Content: Article List or Article Detail */}
          <div className="md:col-span-3 space-y-4">
            <ArticleContent 
              selectedArticle={selectedArticle}
              filteredArticles={filteredArticles}
              categories={categories}
              activeTab={activeTab}
              onArticleClick={handleArticleClick}
              onToggleFavorite={handleToggleFavorite}
              onCloseArticle={handleCloseArticle}
              onArticleDelete={(articleId) => {
                const article = articles.find(a => a._id === articleId);
                
                if (article) {
                  const canDelete = 
                    (article.authorId === currentUser?.id && hasPermission('knowledge:delete_own')) ||
                    hasPermission('knowledge:delete_any');
                    
                  if (!canDelete) {
                    toast({
                      title: "Permissão negada",
                      description: "Você não tem permissão para excluir este artigo",
                      variant: "destructive"
                    });
                    return;
                  }
                }
                
                handleDeleteArticle(articleId);
              }}
              isLoading={isLoading}
              error={error}
              onRefresh={fetchArticles}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onSearch={handleSearch}
              currentUser={currentUser}
              hasPermissionFunction={hasPermission}
            />
          </div>
        </div>
      </div>

      {/* Dialog for creating new article */}
      <Dialog open={isCreatingArticle} onOpenChange={(open) => {
        if (open && !canCreateArticle) {
          toast({
            title: "Permissão negada",
            description: "Você não tem permissão para criar artigos",
            variant: "destructive"
          });
          return;
        }
        setIsCreatingArticle(open);
      }}>
        <ArticleForm 
          newArticle={newArticle}
          setNewArticle={setNewArticle}
          newTag={newTag}
          setNewTag={setNewTag}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
          handleCreateArticle={handleCreateArticle}
          onClose={handleCloseNewArticleDialog}
          categories={categories}
          isSubmitting={isLoading}
        />
      </Dialog>
      
      {/* Dialog para adicionar nova categoria */}
      <Dialog open={isAddCategoryOpen} onOpenChange={(open) => {
        if (open && !canManageCategories) {
          toast({
            title: "Permissão negada",
            description: "Você não tem permissão para gerenciar categorias",
            variant: "destructive"
          });
          return;
        }
        setIsAddCategoryOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Adicione uma nova categoria para organizar seus artigos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nome da Categoria</Label>
              <Input 
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Marketing"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsAddCategoryOpen(false)}
              disabled={isSubmittingCategory}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddCategory}
              className="bg-supernosso-red hover:bg-supernosso-red/90"
              disabled={isSubmittingCategory || !newCategoryName.trim()}
            >
              {isSubmittingCategory ? "Criando..." : "Criar Categoria"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para confirmar exclusão de categoria */}
      <AlertDialog open={isDeleteCategoryOpen} onOpenChange={(open) => {
        if (open && !canManageCategories) {
          toast({
            title: "Permissão negada",
            description: "Você não tem permissão para gerenciar categorias",
            variant: "destructive"
          });
          return;
        }
        setIsDeleteCategoryOpen(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
              {selectedCategoryToDelete && categories.find(c => c.id === selectedCategoryToDelete)?.count > 0 && (
                <p className="text-red-500 mt-2">
                  Esta categoria contém artigos e não pode ser excluída.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingCategory}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-red-500 hover:bg-red-600"
              disabled={isSubmittingCategory || (selectedCategoryToDelete ? categories.find(c => c.id === selectedCategoryToDelete)?.count > 0 : false)}
            >
              {isSubmittingCategory ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default KnowledgeBase;