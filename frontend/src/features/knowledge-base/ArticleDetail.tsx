//src\features\knowledge-base\ArticleDetail.tsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Article, Category } from "./types";
import { cn } from "@/lib/utils";
import { Star, Edit, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

interface ArticleDetailProps {
  article: Article;
  onClose: () => void;
  onToggleFavorite: (articleId: string, event: React.MouseEvent) => void;
  categories: Category[]; // Add categories prop
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  article,
  onClose,
  onToggleFavorite,
  categories
}) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Function to get category name from categoryId
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "";
  };
  
  const handleDeleteArticle = async () => {
    setIsDeleting(true);
    
    try {
      // Chamar a função global de exclusão de artigo se disponível
      if (typeof window !== 'undefined' && window.handleDeleteArticle) {
        await window.handleDeleteArticle(article.id);
      }
      
      // Redirecionar para a página da base de conhecimento após excluir
      navigate("/base-conhecimento");
    } catch (error) {
      console.error("Erro ao excluir artigo:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{article.title}</h2>
            <p className="text-muted-foreground mt-1">{article.description}</p>
            
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="bg-supernosso-light-red text-supernosso-red text-xs px-2 py-1 rounded-full">
                {getCategoryName(article.categoryId)}
              </span>
              
              {article.tags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            
            <Button
              variant="outline"
              className={cn(article.favorite ? "text-supernosso-red" : "")}
              onClick={(e) => onToggleFavorite(article.id, e)}
            >
              <Star className={cn("mr-2 h-4 w-4", article.favorite ? "fill-supernosso-red" : "")} />
              {article.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate(`/base-conhecimento/${article.id}/editar`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-red-500 hover:text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir artigo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteArticle}
                    disabled={isDeleting}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isDeleting ? (
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
          </div>
        </div>
        
        <div className="mt-6 border-t pt-4">
          <div className="prose max-w-none">
            {article.content?.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-8 pt-4 border-t text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <span>{article.views} visualizações</span>
            <span>Atualizado em: {article.date}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => onToggleFavorite(article.id, e)}
            className={article.favorite ? "text-supernosso-red" : ""}
          >
            <Star className={cn("h-5 w-5 mr-1", article.favorite && "fill-supernosso-red")} />
            {article.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};