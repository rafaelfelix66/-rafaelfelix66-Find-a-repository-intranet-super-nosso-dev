// frontend/src/components/timeline/LinkifiedText.tsx
import React from 'react';

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

interface EmojiConfig {
  [key: string]: {
    image: string;
    alt: string;
  };
}

// Configuração dos seus emojis personalizados (centralizada)
export const CUSTOM_EMOJIS: EmojiConfig = {
  'star-eyes': {
    image: '/uploads/emojis/star-eyes.png',
    alt: 'Olhos de estrela'
  },
  'pray-hands': {
    image: '/uploads/emojis/pray-hands.png', 
    alt: 'Mãos em oração'
  },
  'rocket': {
    image: '/uploads/emojis/rocket.png',
    alt: 'Foguete'
  },
  'thumbs-up': {
    image: '/uploads/emojis/thumbs-up.png',
    alt: 'Polegar para cima'
  },
  'heart': {
    image: '/uploads/emojis/heart.png',
    alt: 'Coração'
  },
  'clapping': {
    image: '/uploads/emojis/clapping.png',
    alt: 'Mãos batendo palma'
  }
};

// Função para obter todos os IDs de emojis disponíveis
export const getAvailableEmojiIds = (): string[] => {
  return Object.keys(CUSTOM_EMOJIS);
};

// Componente para renderizar emoji personalizado
interface CustomEmojiProps {
  emojiId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CustomEmojiDisplay: React.FC<CustomEmojiProps> = ({ 
  emojiId, 
  size = 'sm', 
  className = '' 
}) => {
  const emoji = CUSTOM_EMOJIS[emojiId];
  
  if (!emoji) {
    return <span className={className}>❓</span>;
  }
  
  const sizeStyles = {
    sm: { width: '20px', height: '20px' },
    md: { width: '24px', height: '24px' },
    lg: { width: '32px', height: '32px' }
  };
  
  return (
    <img
      src={emoji.image}
      alt={emoji.alt}
      className={`inline-emoji ${className}`}
      style={{ 
        ...sizeStyles[size],
        verticalAlign: 'middle',
        margin: '0 2px',
        display: 'inline-block'
      }}
      onError={(e) => {
        // Se a imagem falhar, mostrar emoji de fallback
        const span = document.createElement('span');
        span.textContent = '❓';
        span.className = className;
        e.currentTarget.parentNode?.replaceChild(span, e.currentTarget);
      }}
    />
  );
};

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text, className }) => {
  // Regex para detectar URLs (mantendo sua implementação original)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  
  // Função para processar emojis personalizados no texto
  const processCustomEmojis = (inputText: string): React.ReactNode[] => {
    if (!inputText) return [inputText];
    
    // Regex para encontrar :emoji-name: no texto
    const emojiRegex = /:([a-zA-Z0-9_-]+):/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = emojiRegex.exec(inputText)) !== null) {
      const [fullMatch, emojiName] = match;
      const emoji = CUSTOM_EMOJIS[emojiName];
      
      // Adicionar texto antes do emoji
      if (match.index > lastIndex) {
        parts.push(inputText.substring(lastIndex, match.index));
      }
      
      // Adicionar emoji se encontrado, senão manter o texto original
      if (emoji) {
        parts.push(
          <CustomEmojiDisplay
            key={`emoji-${emojiName}-${match.index}`}
            emojiId={emojiName}
            size="sm"
          />
        );
      } else {
        parts.push(fullMatch);
      }
      
      lastIndex = match.index + fullMatch.length;
    }
    
    // Adicionar texto restante
    if (lastIndex < inputText.length) {
      parts.push(inputText.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : [inputText];
  };
  
  // Função para processar o texto e criar links (mantendo sua implementação original)
  const processText = () => {
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (!part) return null;
      
      // Verifica se é uma URL
      if (part.match(urlRegex)) {
        let href = part;
        // Adiciona https:// se começar com www.
        if (part.startsWith('www.')) {
          href = 'https://' + part;
        }
        
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0983e6] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      
      // Para texto normal, processa emojis personalizados
      const emojiProcessedContent = processCustomEmojis(part);
      
      return (
        <span key={index}>
          {emojiProcessedContent.map((emojiPart, emojiIndex) => (
            <React.Fragment key={`${index}-${emojiIndex}`}>
              {emojiPart}
            </React.Fragment>
          ))}
        </span>
      );
    });
  };
  
  return <span className={className}>{processText()}</span>;
};