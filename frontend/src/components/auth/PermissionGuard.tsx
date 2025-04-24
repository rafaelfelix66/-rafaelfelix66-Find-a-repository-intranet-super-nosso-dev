// src/components/auth/PermissionGuard.tsx
import React from 'react';
import { usePermission } from '@/hooks/usePermission';

interface PermissionGuardProps {
  requiredPermission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  requiredPermission,
  children,
  fallback = null
}) => {
  const { hasPermission } = usePermission();
  
  if (hasPermission(requiredPermission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};