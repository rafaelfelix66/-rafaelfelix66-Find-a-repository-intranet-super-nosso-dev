// src/services/favoritesService.ts

const STORAGE_KEY = "knowledge_favorites";

// Carregar favoritos do localStorage
export const loadFavorites = (): string[] => {
  try {
    const storedFavorites = localStorage.getItem(STORAGE_KEY);
    if (!storedFavorites) return [];
    return JSON.parse(storedFavorites);
  } catch (error) {
    console.error("Erro ao carregar favoritos:", error);
    return [];
  }
};

// Salvar favoritos no localStorage
export const saveFavorites = (favorites: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Erro ao salvar favoritos:", error);
  }
};

// Adicionar artigo aos favoritos
export const addFavorite = (articleId: string): string[] => {
  const favorites = loadFavorites();
  if (!favorites.includes(articleId)) {
    favorites.push(articleId);
    saveFavorites(favorites);
    console.log(`Artigo ${articleId} adicionado aos favoritos`);
  }
  return favorites;
};

// Remover artigo dos favoritos
export const removeFavorite = (articleId: string): string[] => {
  let favorites = loadFavorites();
  favorites = favorites.filter(id => id !== articleId);
  saveFavorites(favorites);
  console.log(`Artigo ${articleId} removido dos favoritos`);
  return favorites;
};

// Verificar se um artigo está nos favoritos
export const isFavorite = (articleId: string): boolean => {
  const favorites = loadFavorites();
  return favorites.includes(articleId);
};

// Alternar estado de favorito de um artigo
export const toggleFavorite = (articleId: string): boolean => {
  const wasFavorite = isFavorite(articleId);
  
  if (wasFavorite) {
    removeFavorite(articleId);
    return false;
  } else {
    addFavorite(articleId);
    return true;
  }
};