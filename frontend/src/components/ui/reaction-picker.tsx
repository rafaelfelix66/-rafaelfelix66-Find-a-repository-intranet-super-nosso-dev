// Crie um arquivo frontend/src/components/ui/reaction-picker.tsx

import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CUSTOM_EMOJIS, CustomEmojiDisplay } from '@/components/timeline/LinkifiedText';

interface ReactionPickerProps {
  onReactionSelect: (emojiId: string) => void;
  children?: React.ReactNode;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ 
  onReactionSelect, 
  children 
}) => {
  const [open, setOpen] = useState(false);
  
  const handleReactionClick = (emojiId: string) => {
    onReactionSelect(emojiId);
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="ghost" className="flex-1">
            <Smile className="mr-1 h-4 w-4" />
            Reagir
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Escolha uma reação</h3>
          
          <div className="grid grid-cols-6 gap-3">
            {Object.keys(CUSTOM_EMOJIS).map((emojiId) => (
              <Button
                key={emojiId}
                variant="ghost"
                size="sm"
                className="h-12 w-12 p-2 hover:bg-gray-100 rounded-md transition-colors border border-transparent hover:border-gray-200"
                onClick={() => handleReactionClick(emojiId)}
                title={CUSTOM_EMOJIS[emojiId].alt}
              >
                <CustomEmojiDisplay
                  emojiId={emojiId}
                  size="md"
                  className="w-full h-full"
                />
              </Button>
            ))}
          </div>
          
          {Object.keys(CUSTOM_EMOJIS).length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Nenhuma reação disponível
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};