// src/pages/ArticlePage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Edit, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { ArticleForm } from "@/features/knowledge-base/ArticleForm";
import { Dialog } from "@/components/ui/dialog";
import { knowledgeService } from "@/services/knowledgeService";
import { toggleFavorite, isFavorite } from "@/services/favoritesService";
import { categories } from "@/features/knowledge-base/mock-data";

// Mapear IDs de categorias para nomes
const categoryMap: Record<string, string> = {};
categories.forEach(category => {
  categoryMap[category.id] = category.name;
});

const ArticlePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editArticleData, setEditArticleData] = useState<any>({});
  const [newTag, setNewTag] = useState("");
  
  useEffect(() => {
    if (!id) {
      navigate("/base-conhecimento");
      return;
    }
    
    loadArticle(id);
  }, [id, navigate]);
  
  const loadArticle = async (articleId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await knowledgeService.getArticleById(articleId);
      setArticle(data);
      
      // Verificar se o artigo está nos favoritos
      setFavorite(isFavorite(articleId));
      
      // Preparar dados para edição
      setEditArticleData({
        title: data.title,
        description: data.description,
        content: data.content,
        categoryId: data.categoryId,
        tags: data.tags
      });
    } catch (error) {
      console.error("Erro ao carregar artigo:", error);
      setError("Não foi possível carregar o artigo. Tente novamente mais tarde.");
      toast({
        title: "Erro",
        description: "Não foi possível carregar o artigo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleFavorite = () => {
    if (!article) return;
    
    const isFavoriteNow = toggleFavorite(article.id);
    setFavorite(isFavoriteNow);
    
    toast({
      title: isFavoriteNow ? "Adicionado aos favoritos" : "Removido dos favoritos",
      description: isFavoriteNow 
        ? "O artigo foi adicionado aos seus favoritos" 
        : "O artigo foi removido dos seus favoritos",
      variant: "default"
    });
  };
  
  const handleEditArticle = async () => {
    if (!article || !id) return;
    
    setIsSubmitting(true);
    
    try {
      // Mapear para o formato esperado pela API
      const articleData = {
        title: editArticleData.title,
        content: editArticleData.content,
        category: categoryMap[editArticleData.categoryId] || "Sistemas",
        tags: editArticleData.tags
      };
      
      const updatedArticle = await knowledgeService.updateArticle(id, articleData);
      setArticle(updatedArticle);
      
      toast({
        title: "Artigo atualizado",
        description: "As alterações foram salvas com sucesso",
        variant: "default"
      });
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar artigo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o artigo",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteArticle = async () => {
    if (!article || !id) return;
    
    setIsSubmitting(true);
    
    try {
      await knowledgeService.deleteArticle(id);
      
      toast({
        title: "Artigo excluído",
        description: "O artigo foi excluído com sucesso",
        variant: "default"
      });
      
      navigate("/base-conhecimento");
    } catch (error) {
      console.error("Erro ao excluir artigo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o artigo",
        variant: "destructive"
      });
      setIsDeleteDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddTag = () => {
    if (newTag && !editArticleData.tags?.includes(newTag)) {
      setEditArticleData({
        ...editArticleData,
        tags: [...(editArticleData.tags || []), newTag]
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditArticleData({
      ...editArticleData,
      tags: editArticleData.tags?.filter((t: string) => t !== tag)
    });
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-supernosso-red mb-4" />
          <p className="text-muted-foreground">Carregando artigo...</p>
        </div>
      </Layout>
    );
  }
  
  if (error || !article) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-500 mb-2">Erro</h2>
            <p className="text-muted-foreground mb-4">{error || "Artigo não encontrado"}</p>
            <Button onClick={() => navigate("/base-conhecimento")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a base de conhecimento
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <Button 
          variant="outline"
          onClick={() => navigate("/base-conhecimento")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            className={cn(favorite ? "text-supernosso-red" : "")}
            onClick={handleToggleFavorite}
          >
            <Star className={cn("mr-2 h-4 w-4", favorite ? "fill-supernosso-red" : "")} />
            {favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-500 hover:text-red-500"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{article.title}</h1>
            <p className="text-muted-foreground">{article.description}</p>
            
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="bg-supernosso-light-red text-supernosso-red text-xs px-2 py-1 rounded-full">
                {categories.find(c => c.id === article.categoryId)?.name || article.categoryId}
              </span>
              
              {article.tags.map((tag: string) => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="prose max-w-none">
              {article.content?.split('\n').map((line: string, index: number) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-8 pt-4 border-t text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <span>{article.views} visualizações</span>
              <span>Atualizado em: {article.date}</span>
              <span>Autor: {article.author.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Diálogo de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ArticleForm 
          newArticle={editArticleData}
          setNewArticle={setEditArticleData}
          newTag={newTag}
          setNewTag={setNewTag}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
          handleCreateArticle={handleEditArticle}
          onClose={() => setIsEditDialogOpen(false)}
          categories={categories}
          isSubmitting={isSubmitting}
        />
      </Dialog>
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artigo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArticle}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default ArticlePage;