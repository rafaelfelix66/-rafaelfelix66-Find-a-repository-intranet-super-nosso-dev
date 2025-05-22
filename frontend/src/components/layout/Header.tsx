// src/components/layout/Header.tsx
import { useState } from "react";
import { Bell, Search, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/ui/user-avatar";
import { NotificationBell} from "@/components/notifications/NotificationBell";

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
            Bem-vindo(a), {user?.name?.split(' ')[0] || 'Usuário'}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </div>
      </div>
    </header>
  );
}