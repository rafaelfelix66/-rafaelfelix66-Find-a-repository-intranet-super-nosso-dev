// src/components/auth/PrivateRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermission } from '@/hooks/usePermission';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const { isAuthenticated, loading } = useAuth();
  const { hasPermission } = usePermission();
  const location = useLocation();
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  if (!isAuthenticated) {
    // Redirecionar para login com a localização atual como estado
    // para que o usuário possa ser redirecionado de volta após login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Verificar permissão específica, se necessário
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};