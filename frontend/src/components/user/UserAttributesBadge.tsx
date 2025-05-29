// frontend/src/components/user/UserAttributesBadge.tsx (Corrigido com Tooltips)
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, Star, MoreHorizontal } from 'lucide-react';

interface Attribute {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
}

interface AttributeCount {
  attribute: Attribute;
  count: number;
}

interface UserAttributesBadgeProps {
  userId: string;
  attributeCounts?: AttributeCount[];
  loading?: boolean;
  maxToShow?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function UserAttributesBadge({ 
  userId, 
  attributeCounts = [], 
  loading = false,
  maxToShow = 3,
  size = 'md'
}: UserAttributesBadgeProps) {
  // Se estiver carregando, mostrar indicador de loading
  if (loading) {
    return (
      <div className="flex gap-1 mt-1">
        <div className="h-5 w-12 bg-gray-200 animate-pulse rounded-full"></div>
        <div className="h-5 w-10 bg-gray-200 animate-pulse rounded-full"></div>
      </div>
    );
  }
  
  // Se não há atributos, não mostrar nada
  if (attributeCounts.length === 0) {
    return null;
  }
  
  // Ordenar atributos pelo número de vezes recebido (do maior para o menor)
  const sortedAttributes = [...attributeCounts].sort((a, b) => b.count - a.count);
  
  // Limitar ao número máximo a ser exibido
  const visibleAttributes = sortedAttributes.slice(0, maxToShow);
  const remainingAttributes = sortedAttributes.slice(maxToShow);
  const remainingCount = remainingAttributes.length;
  
  // Definir tamanhos baseados no prop size
  const badgeSizes = {
    sm: "h-4 px-1.5 text-xs",
    md: "h-5 px-2 text-xs",
    lg: "h-6 px-3 text-sm"
  };
  
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4"
  };
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {/* Badges dos atributos visíveis */}
      {visibleAttributes.map((item) => (
        <TooltipProvider key={item.attribute._id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline"
                className={`${badgeSizes[size]} flex items-center gap-1 font-normal cursor-help transition-all hover:scale-105`}
                style={{ 
                  backgroundColor: `${item.attribute.color}15`, 
                  borderColor: item.attribute.color,
                  color: item.attribute.color
                }}
              >
                <Star className={`${iconSizes[size]} fill-current`} />
                <span className="font-medium">{item.count}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="max-w-xs p-3 bg-white border shadow-lg z-50"
            >
              <div className="space-y-1">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.attribute.color }}
                  />
                  {item.attribute.name}
                </p>
                <p className="text-xs text-gray-600">
                  {item.attribute.description}
                </p>
                <p className="text-xs font-medium text-gray-800">
                  Recebido {item.count} {item.count === 1 ? 'vez' : 'vezes'}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {/* Badge para mostrar atributos restantes */}
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline"
                className={`${badgeSizes[size]} flex items-center gap-1 font-normal cursor-help bg-gray-50 hover:bg-gray-100 transition-all hover:scale-105`}
              >
                <MoreHorizontal className={iconSizes[size]} />
                <span>+{remainingCount}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="max-w-sm p-3 bg-white border shadow-lg z-50"
            >
              <div className="space-y-2">
                <p className="font-semibold text-sm">
                  Mais {remainingCount} {remainingCount === 1 ? 'atributo' : 'atributos'}:
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {remainingAttributes.map((item) => (
                    <div key={item.attribute._id} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.attribute.color }}
                      />
                      <span className="font-medium">{item.attribute.name}</span>
                      <span className="text-gray-500">×{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}