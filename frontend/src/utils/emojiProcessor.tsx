// frontend/src/components/ui/emoji-picker.tsx
import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

interface CustomEmoji {
  id: string;
  name: string;
  image: string;
  alt: string;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const [open, setOpen] = useState(false);
  
  // Seus emojis personalizados - substitua pelos caminhos das suas imagens
  const customEmojis: { [key: string]: CustomEmoji[] } = {
    'Reações': [
      {
        id: 'star-eyes',
        name: 'Olhos de Estrela',
        image: '/uploads/emojis/star-eyes.png', // Substitua pelo caminho da sua imagem
        alt: 'Emoji com olhos de estrela'
      },
      {
        id: 'pray-hands',
        name: 'Mãos Orando',
        image: '/uploads/emojis/pray-hands.png', // Substitua pelo caminho da sua imagem
        alt: 'Mãos em oração'
      },
      {
        id: 'rocket',
        name: 'Foguete',
        image: '/uploads/emojis/rocket.png', // Substitua pelo caminho da sua imagem
        alt: 'Foguete'
      },
      {
        id: 'thumbs-up',
        name: 'Joinha',
        image: '/uploads/emojis/thumbs-up.png', // Substitua pelo caminho da sua imagem
        alt: 'Polegar para cima'
      },
      {
        id: 'heart',
        name: 'Coração',
        image: '/uploads/emojis/heart.png', // Substitua pelo caminho da sua imagem
        alt: 'Coração'
      },
      {
        id: 'clapping',
        name: 'Palmas',
        image: '/uploads/emojis/clapping.png', // Substitua pelo caminho da sua imagem
        alt: 'Mãos batendo palma'
      }
    ],
    'Frequentes': [
      // Adicione mais emojis personalizados aqui conforme necessário
      {
        id: 'custom-smile',
        name: 'Sorriso Personalizado',
        image: '/uploads/emojis/custom-smile.png',
        alt: 'Sorriso personalizado'
      }
    ]
  };
  
  const handleEmojiClick = (emoji: CustomEmoji) => {
    // Retorna o código do emoji que será processado pelo LinkifiedText
    const emojiCode = `:${emoji.id}:`;
    
    onEmojiSelect(emojiCode);
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="grid gap-3">
          {Object.entries(customEmojis).map(([category, emojiList]) => (
            <div key={category}>
              <h3 className="text-xs font-medium text-gray-500 mb-2">{category}</h3>
              <div className="grid grid-cols-6 gap-2">
                {emojiList.map((emoji) => (
                  <Button
                    key={emoji.id}
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-1 hover:bg-gray-100 rounded-md"
                    onClick={() => handleEmojiClick(emoji)}
                    title={emoji.name}
                  >
                    <img
                      src={emoji.image}
                      alt={emoji.alt}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        // Fallback se a imagem não carregar
                        console.error(`Erro ao carregar emoji: ${emoji.image}`);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </Button>
                ))}
              </div>
            </div>
          ))}
          
          {/* Mensagem se não houver emojis */}
          {Object.values(customEmojis).every(list => list.length === 0) && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Nenhum emoji personalizado disponível
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};