// src/components/layout/AdminMenu.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Settings, 
  Users, 
  Shield, 
  FileText, 
  Image, 
  BarChart 
} from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

export const AdminMenu: React.FC = () => {
  const { hasPermission } = usePermission();
  
  // Verificar se o usuário tem acesso à área administrativa
  if (!hasPermission('admin:access')) {
    return null;
  }
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6">
      <h2 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
        <Settings className="h-5 w-5 mr-2" />
        Administração
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {hasPermission('users:view') && (
          <Link 
            to="/admin/users" 
            className="flex items-center p-3 rounded-md bg-white hover:bg-gray-100 border border-gray-200"
          >
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            <span>Usuários</span>
          </Link>
        )}
        
        {hasPermission('roles:manage') && (
          <Link 
            to="/admin/permissions" 
            className="flex items-center p-3 rounded-md bg-white hover:bg-gray-100 border border-gray-200"
          >
            <Shield className="h-5 w-5 mr-2" />
                Suas Permissões
              </CardTitle>
              <CardDescription>Veja o que você pode fazer no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.keys(permissionMap).length > 0 ? (
                  Object.entries(permissionMap).map(([category, permissions]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="font-medium text-gray-900 capitalize">{category}</h3>
                      <div className="flex flex-wrap gap-2">
                        {permissions.map(permission => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission.split(':')[1]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Nenhuma permissão específica</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};