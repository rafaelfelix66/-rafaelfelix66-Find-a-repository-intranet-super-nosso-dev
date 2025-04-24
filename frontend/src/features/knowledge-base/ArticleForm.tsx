//src/features/knowledge-base/ArticleForm.tsx
import React from "react";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Article, Category } from "./types";
import { Loader2 } from "lucide-react";

interface ArticleFormProps {
  newArticle: Partial<Article>;
  setNewArticle: React.Dispatch<React.SetStateAction<Partial<Article>>>;
  newTag: string;
  setNewTag: React.Dispatch<React.SetStateAction<string>>;
  handleAddTag: () => void;
  handleRemoveTag: (tag: string) => void;
  handleCreateArticle: () => void;
  onClose: () => void;
  categories: Category[];
  isSubmitting?: boolean;
}

export const ArticleForm: React.FC<ArticleFormProps> = ({
  newArticle,
  setNewArticle,
  newTag,
  setNewTag,
  handleAddTag,
  handleRemoveTag,
  handleCreateArticle,
  onClose,
  categories,
  isSubmitting = false
}) => {
  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Criar Novo Artigo</DialogTitle>
        <DialogDescription>
          Preencha os campos abaixo para adicionar um novo artigo à base de conhecimento.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input 
            id="title" 
            value={newArticle.title}
            onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
            placeholder="Insira o título do artigo"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea 
            id="description" 
            value={newArticle.description}
            onChange={(e) => setNewArticle({...newArticle, description: e.target.value})}
            placeholder="Breve descrição do conteúdo"
            rows={2}
            disabled={isSubmitting}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoria</Label>
          <select 
            id="categoryId"
            value={newArticle.categoryId}
            onChange={(e) => setNewArticle({...newArticle, categoryId: e.target.value})}
            className="w-full p-2 border rounded-md"
            disabled={isSubmitting}
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
            {newArticle.tags?.map((tag) => (
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
          <Label htmlFor="content">Conteúdo</Label>
          <Textarea 
            id="content" 
            value={newArticle.content}
            onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
            placeholder="Conteúdo do artigo (suporta formatação Markdown)"
            rows={10}
            disabled={isSubmitting}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleCreateArticle} 
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
      </DialogFooter>
    </DialogContent>
  );
};
