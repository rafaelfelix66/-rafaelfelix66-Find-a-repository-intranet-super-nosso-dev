// src/pages/NewArticlePage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { knowledgeService } from "@/services/knowledgeService";
import { categories } from "@/features/knowledge-base/mock-data";

const NewArticlePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [articleData, setArticleData] = useState({
    title: "",
    description: "",
    content: "",
    categoryId: "sistemas",
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!articleData.title || !articleData.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Mapear para o formato esperado pela API
      const submitData = {
        title: articleData.title,
        content: articleData.content,
        category: getCategoryNameById(articleData.categoryId),
        tags: articleData.tags
      };
      
      const createdArticle = await knowledgeService.createArticle(submitData);
      
      toast({
        title: "Artigo criado",
        description: "Seu artigo foi criado com sucesso!",
      });
      
      // Redirecionar para a página do artigo
      navigate(`/base-conhecimento/${createdArticle.id}`);
    } catch (error) {
      console.error("Erro ao criar artigo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o artigo. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddTag = () => {
    if (newTag && !articleData.tags.includes(newTag)) {
      setArticleData({
        ...articleData,
        tags: [...articleData.tags, newTag]
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setArticleData({
      ...articleData,
      tags: articleData.tags.filter(t => t !== tag)
    });
  };
  
  // Função auxiliar para obter o nome da categoria pelo ID
  const getCategoryNameById = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Sistemas";
  };
  
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
        
        <h1 className="text-2xl font-bold">Novo Artigo</h1>
        
        <div className="w-[120px]">
          {/* Espaço para equilibrar o layout */}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Artigo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título <span className="text-red-500">*</span></Label>
              <Input 
                id="title" 
                value={articleData.title}
                onChange={(e) => setArticleData({...articleData, title: e.target.value})}
                placeholder="Insira o título do artigo"
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description" 
                value={articleData.description}
                onChange={(e) => setArticleData({...articleData, description: e.target.value})}
                placeholder="Breve descrição do conteúdo"
                rows={2}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoria <span className="text-red-500">*</span></Label>
              <select 
                id="categoryId"
                value={articleData.categoryId}
                onChange={(e) => setArticleData({...articleData, categoryId: e.target.value})}
                className="w-full p-2 border rounded-md"
                disabled={isSubmitting}
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="tags" 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Adicionar tag"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  disabled={isSubmitting}
                />
                <Button 
                  type="button" 
                  onClick={handleAddTag} 
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {articleData.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button 
                      onClick={() => handleRemoveTag(tag)}
                      className="text-xs ml-1 hover:text-red-500"
                      type="button"
                      disabled={isSubmitting}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo <span className="text-red-500">*</span></Label>
              <Textarea 
                id="content" 
                value={articleData.content}
                onChange={(e) => setArticleData({...articleData, content: e.target.value})}
                placeholder="Conteúdo do artigo (suporta formatação Markdown)"
                rows={15}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => navigate("/base-conhecimento")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-supernosso-red hover:bg-supernosso-red/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Artigo"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default NewArticlePage;