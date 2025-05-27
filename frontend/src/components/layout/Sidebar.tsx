//src\components\layout\Sidebar.tsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  FileText, 
  Image, 
  MessageSquare, 
  HelpCircle, 
  Menu, 
  X, 
  Settings, 
  LogOut,
  LayoutDashboard,
  Shield,
  BarChart,
  Coins,
  User,
  Building2,
  Link2,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";

interface SidebarItemProps {
  icon: React.ElementType;
  to: string;
  label: string;
  active: boolean;
  isOpen: boolean;
}

const SidebarItem = ({ icon: Icon, to, label, active, isOpen }: SidebarItemProps) => {
  return (
    <Link to={to} className="w-full">
      <Button
        variant="ghost"
        className={cn(
          "sidebar-item w-full justify-start gap-3 my-1 font-normal transition-all",
          !isOpen && "px-0 justify-center",
          active ? 
            "sidebar-item-active bg-white/40 text-white font-medium border-l-4 border-white" : 
            "hover:bg-white/15 hover:text-white"
        )}
      >
        <Icon size={20} />
        {isOpen && <span>{label}</span>}
      </Button>
    </Link>
  );
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const { hasPermission } = usePermission();

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen) {
        const sidebar = document.getElementById("sidebar");
        const menuButton = document.getElementById("menu-toggle");
        
        if (sidebar && 
            !sidebar.contains(event.target as Node) && 
            menuButton && 
            !menuButton.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, isOpen]);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const getActivePath = (path: string) => {
    // Lógica melhorada para detectar caminhos ativos, incluindo subcaminhos
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
  };

  const goToSettings = () => {
    navigate("/configuracoes");
  };

  return (
    <>
      {isMobile && (
        <Button
          id="menu-toggle"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50"
        >
          <Menu />
        </Button>
      )}
      
      <div 
        id="sidebar"
        className={cn(
          "fixed top-0 left-0 h-full shadow-lg transition-all duration-300 z-40",
          isOpen ? "w-64" : isMobile ? "w-0 -translate-x-full" : "w-16",
          "flex flex-col overflow-hidden bg-[#e60909] text-white",
          !isOpen && "sidebar-collapsed"
        )}
      >
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              src="/super-nosso-logo.png" 
              alt="Super Nosso Logo" 
              className="h-8 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://via.placeholder.com/40x40/FFFFFF/FFFFFF?text=SN";
              }}
            />
            {isOpen && <span className="font-bold text-white">Intranet</span>}
          </div>
          {isMobile && isOpen && (
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#e60909]/90" onClick={toggleSidebar}>
              <X size={20} />
            </Button>
          )}
          {!isMobile && (
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#e60909]/90" onClick={toggleSidebar}>
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          )}
        </div>
        
        <div className="flex-1 overflow-auto py-2 px-3">
          <SidebarItem 
            icon={Home} 
            to="/" 
            label="Início" 
            active={getActivePath("/")} 
            isOpen={isOpen}
          />
		  <SidebarItem 
		    icon={Building2} 
			to="/institucional" 
			label="Institucional" 
			active={getActivePath("/institucional")} 
			isOpen={isOpen}
		  />
          <SidebarItem 
            icon={FileText} 
            to="/arquivos" 
            label="Arquivos" 
            active={getActivePath("/arquivos")} 
            isOpen={isOpen}
          />
          <SidebarItem 
            icon={HelpCircle} 
            to="/base-conhecimento" 
            label="Base de Conhecimento" 
            active={getActivePath("/base-conhecimento")} 
            isOpen={isOpen}
          />
		  <SidebarItem 
			icon={GraduationCap} 
			to="/aprendizagem" 
			label="Treinamentos" 
			active={getActivePath("/aprendizagem")} 
			isOpen={isOpen}
		  />
		  {hasPermission('roles:manage') && (
          <SidebarItem 
            icon={MessageSquare} 
            to="/chat" 
            label="Pesquisa" 
            active={getActivePath("/chat")} 
            isOpen={isOpen}
          />
		  )}		  
          {hasPermission('roles:manage') && (
          <SidebarItem 
            icon={Shield} 
            to="/admin/permissions" 
            label="Gerenciar Permissões" 
            active={getActivePath("/admin/permissions")} 
            isOpen={isOpen}
          />
         )}
          {hasPermission('roles:manage') && ( 
          <SidebarItem 
            icon={LayoutDashboard} 
            to="/admin/banners" 
            label="Gerenciar Banners" 
            active={getActivePath("/admin/banners")} 
            isOpen={isOpen}
          />
		  )}
		  {hasPermission('admin:dashboard') && (
		  <SidebarItem 
			icon={BarChart} 
			to="/admin/engagement" 
			label="Dashboard de Engajamento" 
			active={getActivePath("/admin/engagement")} 
			isOpen={isOpen}
		  />
		  )}
		  {hasPermission('supercoins:manage') && (
		  <SidebarItem 
			icon={Coins} 
			to="/admin/supercoins" 
			label="Super Coins" 
			active={getActivePath("/admin/supercoins")} 
			isOpen={isOpen}
		  />
		  )}
		  {hasPermission('roles:manage') && (
          <SidebarItem 
            icon={Link2} 
            to="/links-uteis" 
            label="Links Úteis" 
            active={getActivePath("/links-uteis")} 
            isOpen={isOpen}
          />
         )}
		  <SidebarItem 
		    icon={Briefcase} 
		    to="/vagas" 
		    label="Vagas" 
		    active={getActivePath("/vagas")} 
		    isOpen={isOpen}
		  />		 
		  <SidebarItem 
            icon={User} 
            to="/configuracoes" 
            label="Meu Perfil" 
            active={getActivePath("/configuracoes")} 
            isOpen={isOpen}
          />
        </div>
        
        <div className={cn("p-4 border-t border-white/20", !isOpen && "flex justify-center")}>
          <div 
            className={cn(
              "flex items-center gap-3 cursor-pointer transition-colors hover:bg-[#e60909]/90 p-2 rounded-md",
              !isOpen && "justify-center p-1"
            )}
            onClick={goToSettings}  
          >
            <UserAvatar size="lg" />
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-white">{user?.name || "Funcionário"}</p>
                <p className="text-xs text-white/70 truncate">{user?.email || "funcionario@supernosso.com.br"}</p>
              </div>
            )}
            {isOpen ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-white hover:bg-[#e60909]/90"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
              >
                <LogOut size={18} />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-white hover:bg-[#e60909]/90 ml-0 p-0 h-auto w-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
              >
                <LogOut size={18} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}