// frontend/src/components/user/UserAttributesBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, Star } from 'lucide-react';

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
  // Se estiver carregando ou sem atributos, não mostrar nada
  if (loading || attributeCounts.length === 0) {
    return null;
  }
  
  // Ordenar atributos pelo número de vezes recebido (do maior para o menor)
  const sortedAttributes = [...attributeCounts].sort((a, b) => b.count - a.count);
  
  // Limitar ao número máximo a ser exibido
  const visibleAttributes = sortedAttributes.slice(0, maxToShow);
  const remainingCount = sortedAttributes.length - maxToShow;
  
  // Definir tamanhos baseados no prop size
  const badgeSizes = {
    sm: "h-4 px-1 text-xs",
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
      {visibleAttributes.map((item) => (
        <TooltipProvider key={item.attribute._id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline"
                className={`${badgeSizes[size]} flex items-center gap-1 font-normal`}
                style={{ 
                  backgroundColor: `${item.attribute.color}20`, 
                  borderColor: item.attribute.color,
                  color: item.attribute.color
                }}
              >
                <Star className={iconSizes[size]} />
                <span>{item.count}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">{item.attribute.name} × {item.count}</p>
              <p className="text-sm">{item.attribute.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline"
                className={`${badgeSizes[size]} flex items-center gap-1 font-normal bg-gray-100`}
              >
                <Award className={iconSizes[size]} />
                <span>+{remainingCount}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mais {remainingCount} atributos</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}