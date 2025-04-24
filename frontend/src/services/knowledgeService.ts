// src/services/knowledgeService.ts
import { api } from "./api";
import { Article, Category } from "@/features/knowledge-base/types";

// Interface para dados vindo da API
export interface ApiArticle {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    _id: string;
    nome: string;
  };
  attachments: Array<{
    type: string;
    contentType: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Funções auxiliares
const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR");
};

// Mapear artigo da API para o formato usado no frontend
const mapApiArticleToArticle = (article: ApiArticle, categoryMap: Record<string, string>): Article => {
  return {
    id: article._id,
    title: article.title,
    description: article.content.substring(0, 120) + (article.content.length > 120 ? '...' : ''),
    categoryId: categoryMap[article.category] || "sistemas", // Mapeamento para ID da categoria
    tags: article.tags || [],
    views: 0, // A API não retorna número de visualizações, podemos adicionar isso no backend depois
    date: formatDate(article.createdAt),
    favorite: false, // Informação que seria persistida localmente
    content: article.content,
    pinned: false, // Por agora, definiremos como falso
    author: {
      name: article.author?.nome || "Autor desconhecido",
      avatar: ""
    }
  };
};

// Serviço para interação com a API de conhecimento
export const knowledgeService = {
  // Obter todos os artigos
  getArticles: async (): Promise<Article[]> => {
    try {
      const data: ApiArticle[] = await api.get('/knowledge');
      
      // Mapeamento temporário de nomes de categorias para IDs
      // Em uma implementação mais robusta, você buscaria as categorias da API também
      const categoryMap: Record<string, string> = {
        "Sistemas": "sistemas",
        "RH": "rh",
        "Atendimento": "atendimento",
        "Operacional": "operacional",
        "Segurança": "seguranca"
      };
      
      const articles = data.map(article => mapApiArticleToArticle(article, categoryMap));
      return articles;
    } catch (error) {
      console.error("Erro ao buscar artigos:", error);
      throw error;
    }
  },
  
  // Obter artigo por ID
  getArticleById: async (id: string): Promise<Article> => {
    try {
      const article: ApiArticle = await api.get(`/knowledge/${id}`);
      
      // Mapeamento de categorias (igual ao acima)
      const categoryMap: Record<string, string> = {
        "Sistemas": "sistemas",
        "RH": "rh",
        "Atendimento": "atendimento",
        "Operacional": "operacional",
        "Segurança": "seguranca"
      };
      
      return mapApiArticleToArticle(article, categoryMap);
    } catch (error) {
      console.error(`Erro ao buscar artigo ${id}:`, error);
      throw error;
    }
  },
  
  // Criar um novo artigo
  createArticle: async (articleData: {
    title: string;
    content: string;
    category: string;
    tags: string[];
    attachments?: File[];
  }): Promise<Article> => {
    try {
      // Se não houver arquivos anexos, faz uma requisição POST normal
      if (!articleData.attachments || articleData.attachments.length === 0) {
        const article: ApiArticle = await api.post('/knowledge', {
          title: articleData.title,
          content: articleData.content,
          category: articleData.category,
          tags: articleData.tags.join(',') // A API parece esperar uma string
        });
        
        // Mapeamento de categorias (igual ao acima)
        const categoryMap: Record<string, string> = {
          "Sistemas": "sistemas",
          "RH": "rh",
          "Atendimento": "atendimento",
          "Operacional": "operacional",
          "Segurança": "seguranca"
        };
        
        return mapApiArticleToArticle(article, categoryMap);
      } 
      // Se tiver anexos, usa FormData
      else {
        const formData = new FormData();
        formData.append('title', articleData.title);
        formData.append('content', articleData.content);
        formData.append('category', articleData.category);
        formData.append('tags', articleData.tags.join(','));
        
        // Adicionar anexos
        articleData.attachments.forEach(file => {
          formData.append('attachments', file);
        });
        
        const article: ApiArticle = await api.upload('/knowledge', formData);
        
        // Mapeamento de categorias (igual ao acima)
        const categoryMap: Record<string, string> = {
          "Sistemas": "sistemas",
          "RH": "rh",
          "Atendimento": "atendimento",
          "Operacional": "operacional",
          "Segurança": "seguranca"
        };
        
        return mapApiArticleToArticle(article, categoryMap);
      }
    } catch (error) {
      console.error("Erro ao criar artigo:", error);
      throw error;
    }
  },
  
  // Atualizar um artigo existente
  updateArticle: async (id: string, articleData: {
    title?: string;
    content?: string;
    category?: string;
    tags?: string[];
    attachments?: File[];
  }): Promise<Article> => {
    try {
      // Se não houver arquivos anexos, faz uma requisição PUT normal
      if (!articleData.attachments || articleData.attachments.length === 0) {
        const updateData: any = { ...articleData };
        if (updateData.tags) {
          updateData.tags = updateData.tags.join(',');
        }
        
        const article: ApiArticle = await api.put(`/knowledge/${id}`, updateData);
        
        // Mapeamento de categorias (igual ao acima)
        const categoryMap: Record<string, string> = {
          "Sistemas": "sistemas",
          "RH": "rh",
          "Atendimento": "atendimento",
          "Operacional": "operacional",
          "Segurança": "seguranca"
        };
        
        return mapApiArticleToArticle(article, categoryMap);
      } 
      // Se tiver anexos, usa FormData
      else {
        const formData = new FormData();
        
        if (articleData.title) formData.append('title', articleData.title);
        if (articleData.content) formData.append('content', articleData.content);
        if (articleData.category) formData.append('category', articleData.category);
        if (articleData.tags) formData.append('tags', articleData.tags.join(','));
        
        // Adicionar anexos
        if (articleData.attachments) {
          articleData.attachments.forEach(file => {
            formData.append('attachments', file);
          });
        }
        
        const article: ApiArticle = await api.upload(`/knowledge/${id}`, formData);
        
        // Mapeamento de categorias (igual ao acima)
        const categoryMap: Record<string, string> = {
          "Sistemas": "sistemas",
          "RH": "rh",
          "Atendimento": "atendimento",
          "Operacional": "operacional",
          "Segurança": "seguranca"
        };
        
        return mapApiArticleToArticle(article, categoryMap);
      }
    } catch (error) {
      console.error(`Erro ao atualizar artigo ${id}:`, error);
      throw error;
    }
  },
  
  // Excluir um artigo
  deleteArticle: async (id: string): Promise<void> => {
    try {
      await api.delete(`/knowledge/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir artigo ${id}:`, error);
      throw error;
    }
  }
};