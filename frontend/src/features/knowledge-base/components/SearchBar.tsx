// src/features/knowledge-base/components/SearchBar.tsx
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm, onSearch }) => {
  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Pesquisar artigos, manuais ou palavras-chave..." 
          className="pl-10 h-12"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSearch) {
              onSearch();
            }
          }}
        />
      </div>
      {onSearch && (
        <Button 
          onClick={onSearch} 
          className="bg-supernosso-red hover:bg-supernosso-red/90"
        >
          Buscar
        </Button>
      )}
    </div>
  );
};