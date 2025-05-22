// Atualize o arquivo frontend/src/components/ui/emoji-picker.tsx

import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { customEmojis, CustomEmoji } from './custom-emoji';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  inputRef?: React.RefObject<HTMLDivElement>; // Para integração com EmojiInput
  showAsReactions?: boolean; // Nova prop para mostrar como reações
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ 
  onEmojiSelect, 
  inputRef, 
  showAsReactions = false 
}) => {
  const [open, setOpen] = useState(false);
  
  const handleEmojiClick = (emoji: CustomEmoji) => {
    if (showAsReactions) {
      // Para reações, retorna apenas o ID do emoji
      onEmojiSelect(emoji.id);
    } else {
      // Para texto/comentários, retorna o código do emoji (ex: :heart:)
      const emojiCode = `:${emoji.id}:`;
      onEmojiSelect(emojiCode);
    }
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
              <h3 className="text-xs font-medium text-gray-500 mb-2">
                {showAsReactions ? 'Escolha uma reação' : category}
              </h3>
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