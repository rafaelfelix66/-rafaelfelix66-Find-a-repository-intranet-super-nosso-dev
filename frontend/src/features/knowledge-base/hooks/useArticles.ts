//src\features\knowledge-base\hooks\useArticles.ts
import { useState, useEffect } from "react";
import { Article } from "../types";
import { useToast } from "@/hooks/use-toast";
import { knowledgeService } from "@/services/knowledgeService";
import { loadFavorites, toggleFavorite as toggleFavoriteService } from "@/services/favoritesService";

export const useArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  const [newArticle, setNewArticle] = useState<Partial<Article>>({
    title: "",
    description: "",
    categoryId: "sistemas",
    tags: [],
    content: "",
  });
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Carregar artigos ao inicializar o componente
  useEffect(() => {
    fetchArticles();
  }, []);
  
  // Função para buscar artigos da API
  const fetchArticles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await knowledgeService.getArticles();
      
      // Carregar os favoritos do localStorage e marcar os artigos
      const favorites = loadFavorites();
      
      // Debug para verificar favoritos
      console.log("Favoritos carregados:", favorites);
      
      const articlesWithFavorites = data.map(article => ({
        ...article,
        favorite: favorites.includes(article.id)
      }));
      
      // Log para verificar se os artigos estão sendo marcados como favoritos
      console.log("Artigos com favoritos:", articlesWithFavorites.filter(a => a.favorite));
      
      setArticles(articlesWithFavorites);
    } catch (error) {
      console.error("Erro ao buscar artigos:", error);
      setError("Não foi possível carregar os artigos. Tente novamente mais tarde.");
      toast({
        title: "Erro",
        description: "Não foi possível carregar os artigos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleArticleClick = async (articleId: string) => {
    setIsLoading(true);
    
    try {
      // Buscar o artigo completo da API
      const article = await knowledgeService.getArticleById(articleId);
      
      // Verificar se o artigo está marcado como favorito
      const favorites = loadFavorites();
      const isFavorite = favorites.includes(articleId);
      
      setSelectedArticle({
        ...article,
        favorite: isFavorite
      });
      
      // Atualizar a contagem de visualizações localmente
      setArticles(prev => 
        prev.map(a => a.id === articleId ? {...a, views: a.views + 1} : a)
      );
    } catch (error) {
      console.error("Erro ao buscar detalhes do artigo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do artigo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
  };

  const handleToggleFavorite = (articleId: string, event: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Toggle favorite no localStorage
    const isFavoriteNow = toggleFavoriteService(articleId);
    
    // Atualizar o estado dos artigos
    setArticles(prev => 
      prev.map(article => 
        article.id === articleId 
          ? {...article, favorite: isFavoriteNow} 
          : article
      )
    );
    
    // Se o artigo selecionado for o que está sendo favoritado, atualizar ele também
    if (selectedArticle?.id === articleId) {
      setSelectedArticle(prev => prev ? {...prev, favorite: isFavoriteNow} : null);
    }
    
    // Debug para verificar estado atual dos favoritos
    console.log("Favorito alterado:", articleId, "Novo status:", isFavoriteNow);
    console.log("Favoritos atuais:", loadFavorites());
    
    toast({
      title: isFavoriteNow ? "Adicionado aos favoritos" : "Removido dos favoritos",
      description: isFavoriteNow 
        ? "O artigo foi adicionado aos seus favoritos" 
        : "O artigo foi removido dos seus favoritos",
      variant: "default"
    });
  };
  
  // Função para excluir um artigo
  const handleDeleteArticle = async (articleId: string) => {
    if (!articleId) return;
    
    setIsLoading(true);
    
    try {
      await knowledgeService.deleteArticle(articleId);
      
      // Remover o artigo da lista local
      setArticles(prev => prev.filter(article => article.id !== articleId));
      
      // Se o artigo excluído for o selecionado, fechar a visualização
      if (selectedArticle?.id === articleId) {
        setSelectedArticle(null);
      }
      
      toast({
        title: "Artigo excluído",
        description: "O artigo foi excluído com sucesso",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao excluir artigo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o artigo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag && !newArticle.tags?.includes(newTag)) {
      setNewArticle({
        ...newArticle,
        tags: [...(newArticle.tags || []), newTag]
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewArticle({
      ...newArticle,
      tags: newArticle.tags?.filter(t => t !== tag)
    });
  };

  const handleCreateArticle = async () => {
    if (!newArticle.title || !newArticle.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Mapear para o formato esperado pela API
      const articleData = {
        title: newArticle.title || "",
        content: newArticle.content || "",
        category: getCategoryNameById(newArticle.categoryId || "sistemas"),
        tags: newArticle.tags || []
      };
      
      // Chamar o serviço para criar o artigo
      const createdArticle = await knowledgeService.createArticle(articleData);
      
      // Adicionar o novo artigo à lista
      setArticles(prev => [createdArticle, ...prev]);
      
      // Resetar o formulário
      setNewArticle({
        title: "",
        description: "",
        categoryId: "sistemas",
        tags: [],
        content: "",
      });
      
      setIsCreatingArticle(false);
      
      toast({
        title: "Artigo criado",
        description: "Seu artigo foi criado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao criar artigo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o artigo. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função auxiliar para obter o nome da categoria pelo ID
  const getCategoryNameById = (categoryId: string): string => {
    const categoryMap: Record<string, string> = {
      "sistemas": "Sistemas",
      "rh": "RH",
      "atendimento": "Atendimento", 
      "operacional": "Operacional",
      "seguranca": "Segurança"
    };
    
    return categoryMap[categoryId] || "Sistemas";
  };

  return {
    articles,
    selectedArticle,
    isCreatingArticle,
    newArticle,
    newTag,
    isLoading,
    error,
    setArticles,
    setSelectedArticle,
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
  };
};