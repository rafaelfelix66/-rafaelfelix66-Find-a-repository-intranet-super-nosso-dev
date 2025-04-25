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
  
  // Debug - remova em produção
  // console.log('usePermission hook - user:', user);
  
  // Verificar uma permissão específica
  const hasPermission = (permission: string): boolean => {
    // Se não há usuário, não tem permissão
    if (!user) return false;
    
    // Log para depuração - remova em produção
    // console.log(`Verificando permissão '${permission}' para usuário:`, user.name);
    // console.log('Roles do usuário:', user.roles);
    // console.log('Permissions do usuário:', user.permissions);
    
    // Caso especial: considere 'admin' como tendo todas as permissões
    if (user.roles?.includes('admin')) {
      // console.log('Usuário é admin - permissão concedida');
      return true;
    }
    
    // Verificar permissões do usuário
    const hasDirectPermission = user.permissions?.includes(permission) || false;
    
    // Para debug - remova em produção
    // if (hasDirectPermission) {
    //   console.log(`Permissão '${permission}' encontrada diretamente`);
    // } else {
    //   console.log(`Permissão '${permission}' não encontrada`);
    // }
    
    // Permissões básicas que todos os usuários devem ter
    // Isso é uma solução temporária para evitar bloqueios indesejados
    const basicPermissions = ['timeline:view', 'knowledge:view', 'files:view'];
    if (basicPermissions.includes(permission)) {
      // console.log(`Permissão básica '${permission}' concedida a todos`);
      return true;
    }
    
    return hasDirectPermission;
  };
  
  // Resto do hook permanece o mesmo...
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.roles?.includes('admin')) return true;
    
    return permissions.some(permission => hasPermission(permission));
  };
  
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.roles?.includes('admin')) return true;
    
    return permissions.every(permission => hasPermission(permission));
  };
  
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles?.includes(role) || false;
  };
  
  const isAdmin = !!user?.roles?.includes('admin');
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin
  };
};