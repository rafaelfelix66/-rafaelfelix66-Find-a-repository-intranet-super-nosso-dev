// Crie um arquivo frontend/src/components/ui/custom-emoji.tsx

import React from 'react';

export interface CustomEmoji {
  id: string;
  name: string;
  image: string;
  alt: string;
}

// Definir os emojis personalizados em um local centralizado
export const customEmojis: { [key: string]: CustomEmoji[] } = {
  'Reações': [
    {
      id: 'star-eyes',
      name: 'Olhos de Estrela',
      image: '/uploads/emojis/star-eyes.png',
      alt: 'Emoji com olhos de estrela'
    },
    {
      id: 'pray-hands', 
      name: 'Mãos Orando',
      image: '/uploads/emojis/pray-hands.png',
      alt: 'Mãos em oração'
    },
    {
      id: 'rocket',
      name: 'Foguete', 
      image: '/uploads/emojis/rocket.png',
      alt: 'Foguete'
    },
    {
      id: 'thumbs-up',
      name: 'Joinha',
      image: '/uploads/emojis/thumbs-up.png',
      alt: 'Polegar para cima'
    },
    {
      id: 'heart',
      name: 'Coração',
      image: '/uploads/emojis/heart.png', 
      alt: 'Coração'
    },
    {
      id: 'clapping',
      name: 'Palmas',
      image: '/uploads/emojis/clapping.png',
      alt: 'Mãos batendo palma'
    }
  ]
};

// Função para obter todos os emojis em uma lista plana
export const getAllCustomEmojis = (): CustomEmoji[] => {
  return Object.values(customEmojis).flat();
};

// Função para encontrar um emoji pelo ID
export const findCustomEmojiById = (id: string): CustomEmoji | undefined => {
  return getAllCustomEmojis().find(emoji => emoji.id === id);
};

// Função para converter código de emoji (:heart:) para ID
export const parseEmojiCode = (code: string): string => {
  return code.replace(/:/g, '');
};

// Componente para renderizar um emoji personalizado
interface CustomEmojiDisplayProps {
  emojiId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CustomEmojiDisplay: React.FC<CustomEmojiDisplayProps> = ({ 
  emojiId, 
  size = 'md', 
  className = '' 
}) => {
  const emoji = findCustomEmojiById(emojiId);
  
  if (!emoji) {
    // Fallback para emojis não encontrados
    return <span className={className}>❓</span>;
  }
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };
  
  return (
    <img
      src={emoji.image}
      alt={emoji.alt}
      title={emoji.name}
      className={`object-contain ${sizeClasses[size]} ${className}`}
      onError={(e) => {
        // Fallback se a imagem não carregar
        console.error(`Erro ao carregar emoji: ${emoji.image}`);
        e.currentTarget.style.display = 'none';
        // Criar um span com texto alternativo
        const span = document.createElement('span');
        span.textContent = '❓';
        span.className = className;
        e.currentTarget.parentNode?.replaceChild(span, e.currentTarget);
      }}
    />
  );
};