// src/hooks/usePermission.ts
import { useAuth } from '@/contexts/AuthContext';

interface UsePermissionResult {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
}

export const usePermission = (): UsePermissionResult => {
  const { user } = useAuth();
  
  // Verificar uma permissão específica
  const hasPermission = (permission: string): boolean => {
    // Se não há usuário, não tem permissão
    if (!user) return false;
    
    // Admins têm todas as permissões
    if (user.roles?.includes('admin')) return true;
    
    // Verificar permissões
    return user.permissions?.includes(permission) || false;
  };
  
  // Verificar qualquer uma das permissões
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.roles?.includes('admin')) return true;
    
    return permissions.some(permission => hasPermission(permission));
  };
  
  // Verificar todas as permissões
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.roles?.includes('admin')) return true;
    
    return permissions.every(permission => hasPermission(permission));
  };
  
  // Verificar papel
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles?.includes(role) || false;
  };
  
  // Verificação de administrador
  const isAdmin = !!user?.roles?.includes('admin');
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin
  };
};