// src/components/auth/PrivateRoute.tsx - Versão melhorada
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermission } from '@/hooks/usePermission';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requiredPermission,
  fallback
}) => {
  const { isAuthenticated, isLoading, user, setPendingRedirect } = useAuth();
  const { hasPermission } = usePermission();
  const location = useLocation();
  
  // Salvar a localização atual para redirecionamento após login
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      console.log('Usuário não autenticado, salvando localização para redirecionamento:', location.pathname + location.search);
      setPendingRedirect(location.pathname + location.search);
    }
  }, [isAuthenticated, isLoading, location, setPendingRedirect]);
  
  // Mostrar loading enquanto carrega
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supernosso-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }
  
  // Redirecionar para login se não autenticado
  if (!isAuthenticated) {
    console.log('Redirecionando para login com estado de localização:', {
      from: location.pathname + location.search,
      state: { from: location }
    });
    
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }
  
  // Verificar permissão específica se necessário
  if (requiredPermission && user) {
    console.log(`Verificando permissão '${requiredPermission}' para usuário:`, user.name);
    
    if (!hasPermission(requiredPermission)) {
      console.log(`Usuário não possui permissão '${requiredPermission}'`);
      
      // Se há um fallback personalizado, usar ele
      if (fallback) {
        return <>{fallback}</>;
      }
      
      // Caso contrário, redirecionar para página de não autorizado
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // Se chegou aqui, usuário está autenticado e tem as permissões necessárias
  return <>{children}</>;
};