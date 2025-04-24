// src/components/auth/OwnershipGuard.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermission } from '@/hooks/usePermission';

interface OwnershipGuardProps {
  resourceOwnerId: string;
  specialPermission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const OwnershipGuard: React.FC<OwnershipGuardProps> = ({
  resourceOwnerId,
  specialPermission,
  children,
  fallback = null
}) => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  
  // Verificar se é proprietário ou tem permissão especial
  const isOwner = user?.id === resourceOwnerId;
  const hasSpecialPermission = hasPermission(specialPermission);
  
  if (isOwner || hasSpecialPermission) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};