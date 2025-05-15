// src/components/layout/Header.tsx
import { useState } from "react";
import { Bell, Search, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/ui/user-avatar";

export function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };
  
  return (
    <header className="w-full bg-white dark:bg-gray-900 border-b px-4 py-3 sticky top-0 z-30 shadow-sm transition-all">
      <div className="flex justify-between items-center">
        <div className="ml-4 sm:ml-16 md:ml-20 lg:ml-64 transition-all flex items-center gap-3">
          <UserAvatar size="sm" />
          <h2 className="text-xl font-bold text-supernosso-darkgray">
            Bem-vindo, {user?.name?.split(' ')[0] || 'Usuário'}
          </h2>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {!isMobile && (
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Pesquisar..." 
                className="pl-8 bg-gray-50 focus-visible:ring-supernosso-red"
              />
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 h-2 w-2 bg-supernosso-red rounded-full"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2 font-medium border-b">Notificações</div>
              <DropdownMenuItem className="flex flex-col items-start p-3 gap-1 cursor-pointer">
                <div className="font-medium">Novo arquivo compartilhado</div>
                <div className="text-sm text-gray-500">Maria compartilhou o arquivo "Relatório de Vendas"</div>
                <div className="text-xs text-gray-400">Há 5 minutos</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start p-3 gap-1 cursor-pointer">
                <div className="font-medium">Novo comentário</div>
                <div className="text-sm text-gray-500">João comentou na sua publicação</div>
                <div className="text-xs text-gray-400">Há 30 minutos</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </div>
      </div>
    </header>
  );
}