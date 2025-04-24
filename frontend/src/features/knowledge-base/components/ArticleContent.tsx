//src\features\knowledge-base\components\ArticleContent.tsx
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleList } from "../ArticleList";
import { ArticleDetail } from "../ArticleDetail";
import { Article, Category } from "../types";
import { Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";

interface ArticleContentProps {
  selectedArticle: Article | null;
  filteredArticles: Article[];
  categories: Category[];
  activeTab: string;
  onArticleClick: (articleId: string) => void;
  onToggleFavorite: (articleId: string, event: React.MouseEvent) => void;
  onCloseArticle: () => void;
  onArticleDelete?: (articleId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch?: () => void;
}

export const ArticleContent: React.FC<ArticleContentProps> = ({
  selectedArticle,
  filteredArticles,
  categories,
  activeTab,
  onArticleClick,
  onToggleFavorite,
  onCloseArticle,
  onArticleDelete,
  isLoading = false,
  error = null,
  onRefresh,
  searchTerm,
  setSearchTerm,
  onSearch
}) => {
  if (selectedArticle) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-supernosso-red mb-4" />
          <p className="text-muted-foreground">Carregando artigo...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTitle>Erro ao carregar o artigo</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2 flex gap-2">
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  Tentar novamente
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onCloseArticle}>
                Voltar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <ArticleDetail 
        article={selectedArticle} 
        onClose={onCloseArticle}
        onToggleFavorite={onToggleFavorite}
        categories={categories}
      />
    );
  }

  return (
    <>
      {/* Barra de pesquisa única */}
      <SearchBar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearch={onSearch}
      />

      {isLoading && filteredArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-supernosso-red mb-4" />
          <p className="text-muted-foreground">Carregando artigos...</p>
        </div>
      ) : error && filteredArticles.length === 0 ? (
        <Alert variant="destructive" className="my-4">
          <AlertTitle>Erro ao carregar artigos</AlertTitle>
          <AlertDescription>
            {error}
            {onRefresh && (
              <Button variant="outline" size="sm" className="mt-2" onClick={onRefresh}>
                Tentar novamente
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="relevantes" className="w-full">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="relevantes">Mais Relevantes</TabsTrigger>
              <TabsTrigger value="recentes">Mais Recentes</TabsTrigger>
              <TabsTrigger value="vistos">Mais Vistos</TabsTrigger>
            </TabsList>
            
            <div className="text-sm text-muted-foreground">
              {filteredArticles.length} artigos encontrados
            </div>
          </div>
          
          <TabsContent value="relevantes" className="mt-4 space-y-4">
            <ArticleList 
              articles={filteredArticles}
              categories={categories}
              selectedCategory={activeTab}
              onArticleClick={onArticleClick}
              onToggleFavorite={onToggleFavorite}
			  onArticleDelete={onArticleDelete}
              isLoading={isLoading}
              error={error}
              onRefresh={onRefresh}
            />
          </TabsContent>
          
          <TabsContent value="recentes" className="mt-4 space-y-4">
            <ArticleList 
              articles={filteredArticles
                .sort((a, b) => new Date(b.date.split('/').reverse().join('-')).getTime() - 
                              new Date(a.date.split('/').reverse().join('-')).getTime())}
              categories={categories}
              selectedCategory={activeTab}
              onArticleClick={onArticleClick}
              onToggleFavorite={onToggleFavorite}
			  onArticleDelete={onArticleDelete}
              isLoading={isLoading}
              error={error}
              onRefresh={onRefresh}
            />
          </TabsContent>
          
          <TabsContent value="vistos" className="mt-4 space-y-4">
            <ArticleList 
              articles={filteredArticles
                .sort((a, b) => b.views - a.views)}
              categories={categories}
              selectedCategory={activeTab}
              onArticleClick={onArticleClick}
              onToggleFavorite={onToggleFavorite}
			  onArticleDelete={onArticleDelete}
              isLoading={isLoading}
              error={error}
              onRefresh={onRefresh}
            />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
};