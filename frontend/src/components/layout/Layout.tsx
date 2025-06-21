//src/components/layout/Layout.tsx - Corrigido para usar estrutura original
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import "@/styles/home.css"; // Importando nossos novos estilos personalizados

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col transition-all main-content",
        isMobile ? "ml-0" : "ml-16 md:ml-16 lg:ml-16"
      )}>
        <Header />
        <main className="flex-1 py-6 px-4 md:px-6 max-w-screen-2xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}