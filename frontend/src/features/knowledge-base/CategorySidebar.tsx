//src/features/knowledge-base/CategorySidebar.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Category } from "./types";
import { cn } from "@/lib/utils";
import { Book, Star, Plus, Trash2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CategorySidebarProps {
  categories: Category[];
  articleCount: number;
  favoritesCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsCreatingArticle: (value: boolean) => void;
  onAddCategory?: () => void;
  onDeleteCategory?: (categoryId: string) => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  articleCount,
  favoritesCount,
  activeTab,
  setActiveTab,
  setIsCreatingArticle,
  onAddCategory,
  onDeleteCategory
}) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Categorias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button 
            className={cn(
              "w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-colors",
              activeTab === "todos" 
                ? "bg-supernosso-light-red text-supernosso-red font-medium" 
                : "hover:bg-gray-100"
            )}
            onClick={() => setActiveTab("todos")}
          >
            <FileText className="h-4 w-4" />
            <span>Todos os artigos</span>
            <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
              {articleCount}
            </span>
          </button>
          
          <button 
            className={cn(
              "w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-colors",
              activeTab === "favoritos" 
                ? "bg-supernosso-light-red text-supernosso-red font-medium" 
                : "hover:bg-gray-100"
            )}
            onClick={() => setActiveTab("favoritos")}
          >
            <Star className="h-4 w-4" />
            <span>Favoritos</span>
            <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
              {favoritesCount}
            </span>
          </button>
          
          <div className="pt-2 border-t mt-2 space-y-1">
            {categories.map((category) => (
              <div 
                key={category.id}
                className="flex items-center"
              >
                <button 
                  className={cn(
                    "flex-1 text-left px-3 py-2 rounded-md flex items-center gap-2 transition-colors",
                    activeTab === category.id.toLowerCase() 
                      ? "bg-supernosso-light-red text-supernosso-red font-medium" 
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => setActiveTab(category.id.toLowerCase())}
                >
                  {category.icon}
                  <span>{category.name}</span>
                  <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </button>
                
                {onDeleteCategory && (
                  <button 
                    className="p-1 text-gray-500 hover:text-red-500"
                    onClick={() => onDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Botão de ação */}
      <div className="flex flex-col gap-2">
		  <Button 
			className="w-full bg-supernosso-red hover:bg-supernosso-red/90 text-white"
			onClick={() => navigate("/base-conhecimento/novo")}
		  >
			<Plus className="h-4 w-4 mr-2" />
			Novo Artigo
		  </Button>
		  {onAddCategory && (
			<Button 
			  variant="outline"
			  className="w-full"
			  onClick={onAddCategory}
			>
			  <Plus className="h-4 w-4 mr-2" />
			  Nova Categoria
			</Button>
		  )}
		</div>
    </div>
  );
};