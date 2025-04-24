// src/services/categoryService.ts
import { api } from "./api";
import { Category } from "@/features/knowledge-base/types";

// Como o backend ainda não suporta categorias, vamos simular a persistência
// usando localStorage de maneira mais robusta

const STORAGE_KEY = "knowledge_categories";

// Função para carregar categorias do localStorage
export const loadCategories = (): Category[] => {
  try {
    const savedCategories = localStorage.getItem(STORAGE_KEY);
    if (!savedCategories) return [];
    
    const parsedCategories = JSON.parse(savedCategories);
    
    // Se as categorias não tiverem ícones, adicionamos um placeholder
    // No componente real, os ícones serão definidos
    return parsedCategories.map((cat: any) => ({
      ...cat,
      icon: cat.icon || null
    }));
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    return [];
  }
};

// Função para salvar categorias no localStorage
export const saveCategories = (categories: Category[]): void => {
  try {
    // Removemos os ícones React antes de salvar para evitar problemas
    const categoriesToSave = categories.map(({ id, name, count, color }) => ({ 
      id, name, count, color 
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categoriesToSave));
  } catch (error) {
    console.error('Erro ao salvar categorias:', error);
  }
};

// Função para criar uma nova categoria
export const createCategory = async (
  name: string, 
  icon: React.ReactNode,
  color: string = "blue-500"
): Promise<Category> => {
  // Para uma situação real, aqui faríamos uma chamada de API:
  // const response = await api.post('/categories', { name, color });
  
  // Mas por enquanto, apenas simulamos com localStorage
  const newId = name.toLowerCase().replace(/\s+/g, '-');
  
  // Verificar se já existe uma categoria com este ID
  const existingCategories = loadCategories();
  if (existingCategories.some(c => c.id === newId)) {
    throw new Error("Já existe uma categoria com este nome.");
  }
  
  // Criar a nova categoria
  const newCategory: Category = {
    id: newId,
    name,
    icon,
    count: 0,
    color
  };
  
  // Salvar no localStorage
  const updatedCategories = [...existingCategories, newCategory];
  saveCategories(updatedCategories);
  
  return newCategory;
};

// Função para excluir uma categoria
export const deleteCategory = async (categoryId: string): Promise<void> => {
  // Para uma situação real, aqui faríamos uma chamada de API:
  // await api.delete(`/categories/${categoryId}`);
  
  // Mas por enquanto, apenas simulamos com localStorage
  const categories = loadCategories();
  
  // Verificar se a categoria existe
  if (!categories.some(c => c.id === categoryId)) {
    throw new Error("Categoria não encontrada.");
  }
  
  // Remover a categoria
  const updatedCategories = categories.filter(c => c.id !== categoryId);
  saveCategories(updatedCategories);
};

// Função para atualizar a contagem de artigos em uma categoria
export const updateCategoryCount = async (categoryId: string, count: number): Promise<void> => {
  // Para uma situação real, aqui faríamos uma chamada de API:
  // await api.put(`/categories/${categoryId}`, { count });
  
  // Mas por enquanto, apenas simulamos com localStorage
  const categories = loadCategories();
  
  // Atualizar a contagem da categoria
  const updatedCategories = categories.map(c => {
    if (c.id === categoryId) {
      return { ...c, count };
    }
    return c;
  });
  
  saveCategories(updatedCategories);
};