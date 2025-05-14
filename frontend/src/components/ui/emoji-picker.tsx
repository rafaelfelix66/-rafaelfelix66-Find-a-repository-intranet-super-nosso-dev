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

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const [open, setOpen] = useState(false);
  
  // Emojis populares organizados por categoria
  const emojis = {
    'Frequentes': ['😀', '😃', '😄', '😁', '😊', '😉', '😎', '😍', '🥰', '😘'],
    'Reações': ['👍', '👏', '🙏', '💪', '✨', '🎉', '🎊', '💯', '❤️', '💚'],
    'Expressões': ['😂', '🤣', '😭', '😢', '😅', '😆', '🙃', '😌', '😔', '😕'],
    'Gestos': ['👋', '✋', '🤚', '🖐️', '👌', '✌️', '🤞', '🤟', '🤘', '👊'],
    'Objetos': ['🎁', '🎂', '🍰', '🎈', '📌', '💼', '📝', '📅', '📍', '🔔'],
    'Símbolos': ['✅', '❌', '⭐', '🔥', '💡', '🚀', '⚡', '🌟', '💫', '🌈']
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="grid gap-2">
          {Object.entries(emojis).map(([category, emojiList]) => (
            <div key={category}>
              <h3 className="text-xs font-medium text-gray-500 mb-1">{category}</h3>
              <div className="grid grid-cols-10 gap-1">
                {emojiList.map((emoji, index) => (
                  <Button
                    key={`${category}-${index}`}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={() => {
                      onEmojiSelect(emoji);
                      setOpen(false);
                    }}
                  >
                    <span className="text-lg">{emoji}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};