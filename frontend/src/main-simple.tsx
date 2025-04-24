//frontend/src/main-simple.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App-simple'; // Usando a versão simplificada

// Adicionando logs para depuração
console.log('Intranet Super Nosso - Inicializando aplicação simplificada...');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Elemento root não encontrado no DOM!');
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('Aplicação simplificada renderizada com sucesso');
  } catch (error) {
    console.error('Erro ao renderizar a aplicação simplificada:', error);
  }
}