// frontend/src/components/ui/user-avatar.tsx (Corrigido)
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
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Briefcase, Building2, X } from "lucide-react";
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
  
  // CORREÇÃO: Garantir que o userId seja uma string válida
  const userId = user?.id || user?._id || '';
  //console.log('UserAvatar - userId para buscar atributos:', userId);
  //console.log('UserAvatar - user object:', user);
  
  // Usar o hook para buscar atributos do usuário apenas se showAttributes for true E tiver userId
  const { 
    attributes, 
    loading: attributesLoading 
  } = useUserAttributes(showAttributes && userId ? userId : '');
  
  // Debug dos atributos
  //console.log('UserAvatar - Atributos carregados:', attributes);
  //console.log('UserAvatar - Loading atributos:', attributesLoading);
  
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
		  className="object-cover w-full h-full"
		  style={{ aspectRatio: '1 / 1' }}
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
      
      {/* Mostrar badges de atributos se solicitado E se tiver userId válido */}
      {showAttributes && userId && (
        <UserAttributesBadge 
          userId={userId} 
          attributeCounts={attributes}
          loading={attributesLoading}
          size={size === "lg" ? "md" : "sm"}
          maxToShow={size === "sm" ? 2 : 3}
        />
      )}
      
      {/* Modal para mostrar a imagem grande */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Perfil de {user?.name || "usuário"}</DialogTitle>
            <DialogDescription>Visualização do perfil do usuário</DialogDescription>
          </DialogHeader>
          
          {/* Botão de fechar */}
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white border-0"
              onClick={() => setShowImageModal(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </DialogClose>
          
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-grid-white/[0.02] rounded-lg" />
            
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
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-900">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#e60909] to-[#ff4444] flex items-center justify-center">
                        <span className="text-3xl text-white font-bold">
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
                  <h3 className="text-xl font-bold text-white mb-2">
                    {user?.name || "Usuário"}
                  </h3>
                  
                  {/* Cargo e Departamento */}
                  <div className="flex items-center justify-center gap-4 text-gray-400 text-sm">
                    {user?.cargo && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span>{user.cargo}</span>
                      </div>
                    )}
                    
                    {user?.cargo && user?.department && (
                      <span className="text-gray-600">•</span>
                    )}
                    
                    {user?.department && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        <span>{user.department}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* CORREÇÃO: Mostrar atributos no modal apenas se tiver userId */}
                {userId && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-white mb-3">
                      Reconhecimentos Recebidos
                    </h4>
                    <div className="flex flex-wrap justify-center gap-2">
                      {attributesLoading ? (
                        <div className="flex gap-2">
                          <div className="h-5 w-16 bg-gray-600 animate-pulse rounded-full"></div>
                          <div className="h-5 w-12 bg-gray-600 animate-pulse rounded-full"></div>
                          <div className="h-5 w-14 bg-gray-600 animate-pulse rounded-full"></div>
                        </div>
                      ) : attributes.length > 0 ? (
                        <UserAttributesBadge 
                          userId={userId}
                          attributeCounts={attributes}
                          loading={attributesLoading}
                          maxToShow={10}
                          size="md"
                        />
                      ) : (
                        <p className="text-gray-400 text-xs">
                          Nenhum reconhecimento recebido ainda
                        </p>
                      )}
                    </div>
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