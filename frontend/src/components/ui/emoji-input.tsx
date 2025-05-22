// frontend/src/components/ui/emoji-input.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EmojiConfig {
  [key: string]: {
    image: string;
    alt: string;
  };
}

// Configuração dos seus emojis personalizados
const CUSTOM_EMOJIS: EmojiConfig = {
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

interface EmojiInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const EmojiInput: React.FC<EmojiInputProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  disabled
}) => {
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Função para detectar se há emojis no texto
  const hasEmojis = /:([a-zA-Z0-9_-]+):/.test(value);

  // Função para renderizar preview de emojis
  const renderEmojiPreview = (text: string) => {
    const emojiRegex = /:([a-zA-Z0-9_-]+):/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = emojiRegex.exec(text)) !== null) {
      const [fullMatch, emojiName] = match;
      const emoji = CUSTOM_EMOJIS[emojiName];

      // Adicionar texto antes do emoji
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Adicionar emoji se encontrado
      if (emoji) {
        parts.push(
          <img
            key={`emoji-${emojiName}-${match.index}`}
            src={emoji.image}
            alt={emoji.alt}
            className="inline-block w-4 h-4 mx-0.5"
            style={{ verticalAlign: 'middle' }}
          />
        );
      } else {
        parts.push(
          <span key={`emoji-${match.index}`}>{fullMatch}</span>
        );
      }

      lastIndex = match.index + fullMatch.length;
    }

    // Adicionar texto restante
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className="relative flex-1">
      {/* Input real - MANTÉM TODAS AS CLASSES ORIGINAIS */}
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn(
          className,
          hasEmojis && !isComposing && "text-transparent caret-black selection:bg-blue-200"
        )}
        disabled={disabled}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
      />

      {/* Overlay com preview de emojis - SÓ APARECE QUANDO HÁ EMOJIS */}
      {hasEmojis && !isComposing && (
        <div 
          className="absolute inset-0 flex items-center px-3 pointer-events-none overflow-hidden z-10"
          style={{
            fontSize: '14px',
            lineHeight: '20px',
            color: 'inherit'
          }}
        >
          <div className="flex items-center">
            {renderEmojiPreview(value)}
          </div>
        </div>
      )}
    </div>
  );
};

// Hook personalizado para usar com o EmojiInput
export const useEmojiInput = (initialValue = '') => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLDivElement>(null);

  const insertEmoji = (emojiCode: string) => {
    if (inputRef.current && (inputRef.current as any).insertEmoji) {
      (inputRef.current as any).insertEmoji(emojiCode);
    } else {
      // Fallback: adicionar no final
      setValue(prev => prev + emojiCode);
    }
  };

  const reset = () => setValue('');

  return {
    value,
    setValue,
    insertEmoji,
    reset,
    inputRef
  };
};