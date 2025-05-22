// frontend/src/components/ui/user-avatar.tsx (Melhorado)
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Briefcase, Building2 } from "lucide-react";
import { UserAttributesBadge } from "@/components/user/UserAttributesBadge";
import { useUserAttributes } from "@/hooks/useUserAttributes";

interface UserAvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showBorder?: boolean;
  showAttributes?: boolean;
  user?: {
    id?: string;
    name?: string;
    avatar?: string;
    cargo?: string;
    department?: string;
  } | null;
  onClick?: () => void;
  enableModal?: boolean;
}

export function UserAvatar({ 
  className, 
  size = "md", 
  showBorder = false,
  showAttributes = false,
  user: propUser, 
  onClick,
  enableModal = false 
}: UserAvatarProps) {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Usar o hook para buscar atributos do usuário
  const { attributes, loading } = useUserAttributes(user?.id || '');
  
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16"
  };
  
  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl"
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (enableModal) {
      setShowImageModal(true);
    }
  };
  
  return (
    <div className="inline-flex flex-col items-center">
      <Avatar 
        className={cn(
          sizeClasses[size],
          showBorder && "ring-2 ring-white ring-offset-2",
          (onClick || enableModal) && "cursor-pointer hover:opacity-80 transition-opacity",
          className
        )}
        onClick={handleClick}
      >
        <AvatarImage 
          src={user?.avatar} 
          alt={user?.name}
        />
        <AvatarFallback 
          className={cn(
            "bg-[#e60909] text-white font-medium",
            textSizes[size]
          )}
        >
          {getInitials(user?.name || "")}
        </AvatarFallback>
      </Avatar>
      
      {/* Mostrar badges de atributos se solicitado */}
      {showAttributes && user?.id && attributes.length > 0 && (
        <UserAttributesBadge 
          userId={user.id} 
          attributeCounts={attributes}
          loading={loading}
          size={size === "lg" ? "md" : "sm"}
          maxToShow={size === "sm" ? 2 : 3}
        />
      )}
      
      {/* Modal para mostrar a imagem grande */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-md border-0 p-0 overflow-hidden">
          {/* Título oculto para acessibilidade */}
          <div className="sr-only">
            <DialogTitle>Perfil de {user?.name || "usuário"}</DialogTitle>
            <DialogDescription>Visualização do perfil</DialogDescription>
          </div>
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-grid-white/[0.02]" />
            
            {/* Glow effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-96 h-96 bg-[#e60909]/20 rounded-full blur-3xl" />
            </div>
            
            {/* Content container */}
            <div className="relative z-10 p-8">
              {/* Avatar grande circular */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {/* Ring decorativo */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#e60909] to-[#ff4444] p-1">
                    <div className="w-full h-full rounded-full bg-gray-900" />
                  </div>
                  
                  {/* Avatar container */}
                  <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-gray-900">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#e60909] to-[#ff4444] flex items-center justify-center">
                        <span className="text-5xl text-white font-bold">
                          {getInitials(user?.name || "")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Informações do usuário */}
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {user?.name || "Usuário"}
                  </h3>
                  
                  {/* Cargo e Departamento */}
                  <div className="flex items-center justify-center gap-4 text-gray-400">
                    {user?.cargo && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-sm">{user.cargo}</span>
                      </div>
                    )}
                    
                    {user?.cargo && user?.department && (
                      <span className="text-gray-600">•</span>
                    )}
                    
                    {user?.department && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm">{user.department}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Mostrar atributos no modal */}
                {user?.id && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <UserAttributesBadge 
                      userId={user.id}
                      attributeCounts={attributes}
                      loading={loading}
                      maxToShow={10}
                      size="lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}