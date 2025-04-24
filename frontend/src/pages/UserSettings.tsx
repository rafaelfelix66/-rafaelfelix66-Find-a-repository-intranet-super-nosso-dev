// src/pages/UserSettings.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

export const UserSettings: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <div>Carregando...</div>;
  }
  
  // Agrupar permissões por categoria
  const permissionMap: Record<string, string[]> = {};
  
  user.permissions?.forEach(permission => {
    const [category] = permission.split(':');
    if (!permissionMap[category]) {
      permissionMap[category] = [];
    }
    permissionMap[category].push(permission);
  });
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Configurações do Usuário</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>Seus dados pessoais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nome</p>
                  <p className="text-gray-900">{user.nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Cargo</p>
                  <p className="text-gray-900">{user.cargo || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Departamento</p>
                  <p className="text-gray-900">{user.departamento || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Papéis</CardTitle>
              <CardDescription>Seus papéis no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.roles?.length ? (
                  user.roles.map(role => (
                    <Badge key={role} variant="secondary" className="text-sm">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum papel atribuído</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5w-5 mr-2 text-purple-600" />
<span>Permissões</span>
</Link>
)}
  {hasPermission('knowledge:view') && (
    <Link 
      to="/admin/knowledge" 
      className="flex items-center p-3 rounded-md bg-white hover:bg-gray-100 border border-gray-200"
    >
      <FileText className="h-5 w-5 mr-2 text-green-600" />
      <span>Base de Conhecimento</span>
    </Link>
  )}
  
  {hasPermission('banners:view') && (
    <Link 
      to="/admin/banners" 
      className="flex items-center p-3 rounded-md bg-white hover:bg-gray-100 border border-gray-200"
    >
      <Image className="h-5 w-5 mr-2 text-orange-600" />
      <span>Banners</span>
    </Link>
  )}
  
  {hasPermission('admin:access') && (
    <Link 
      to="/admin/stats" 
      className="flex items-center p-3 rounded-md bg-white hover:bg-gray-100 border border-gray-200"
    >
      <BarChart className="h-5 w-5 mr-2 text-blue-600" />
      <span>Estatísticas</span>
    </Link>
  )}
</div>
  </div>
);


};