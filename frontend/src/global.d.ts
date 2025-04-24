// src/global.d.ts 
//Para definir tipos para objetos globais do window
interface Window {
  handleDeleteArticle?: (articleId: string) => void;
}