import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, Search, UserPlus, Pencil, Trash2, Shield } from 'lucide-react';

// Tipos
interface User {
  _id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  roles: string[];
  permissions: string[];
}

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface PermissionCategory {
  name: string;
  key: string;
  permissions: Permission[];
}

interface Permission {
  key: string;
  description: string;
}

export function PermissionManagement() {
  // Estados
  const [activeTab, setActiveTab] = useState<string>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Estado para diálogos
  const [isUserDialogOpen, setIsUserDialogOpen] = useState<boolean>(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState<boolean>(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  const { toast } = useToast();
  
  // Categorias de permissões
  const permissionCategories: PermissionCategory[] = [
    {
      name: 'Timeline',
      key: 'timeline',
      permissions: [
        { key: 'timeline:view', description: 'Visualizar posts' },
        { key: 'timeline:create', description: 'Criar publicações' },
        { key: 'timeline:edit_own', description: 'Editar próprias publicações' },
        { key: 'timeline:delete_own', description: 'Excluir próprias publicações' },
        { key: 'timeline:delete_any', description: 'Excluir qualquer publicação' },
        { key: 'timeline:comment', description: 'Adicionar comentários' },
        { key: 'timeline:delete_comment_own', description: 'Excluir próprios comentários' },
        { key: 'timeline:delete_comment_any', description: 'Excluir qualquer comentário' },
      ],
    },
    {
      name: 'Arquivos',
      key: 'files',
      permissions: [
        { key: 'files:view', description: 'Visualizar arquivos' },
        { key: 'files:upload', description: 'Fazer upload de arquivos' },
        { key: 'files:download', description: 'Baixar arquivos' },
        { key: 'files:delete_own', description: 'Excluir próprios arquivos' },
        { key: 'files:delete_any', description: 'Excluir qualquer arquivo' },
        { key: 'files:create_folder', description: 'Criar pastas' },
        { key: 'files:share', description: 'Compartilhar arquivos' },
      ],
    },
    {
      name: 'Base de Conhecimento',
      key: 'knowledge',
      permissions: [
        { key: 'knowledge:view', description: 'Visualizar artigos' },
        { key: 'knowledge:create', description: 'Criar artigos' },
        { key: 'knowledge:edit_own', description: 'Editar próprios artigos' },
        { key: 'knowledge:edit_any', description: 'Editar qualquer artigo' },
        { key: 'knowledge:delete_own', description: 'Excluir próprios artigos' },
        { key: 'knowledge:delete_any', description: 'Excluir qualquer artigo' },
      ],
    },
    {
      name: 'Calendário/Eventos',
      key: 'calendar',
      permissions: [
        { key: 'calendar:view', description: 'Visualizar calendário' },
        { key: 'calendar:create', description: 'Criar eventos' },
        { key: 'calendar:edit_own', description: 'Editar próprios eventos' },
        { key: 'calendar:edit_any', description: 'Editar qualquer evento' },
        { key: 'calendar:delete_own', description: 'Excluir próprios eventos' },
        { key: 'calendar:delete_any', description: 'Excluir qualquer evento' },
      ],
    },
    {
      name: 'Banners',
      key: 'banners',
      permissions: [
        { key: 'banners:view', description: 'Visualizar banners' },
        { key: 'banners:create', description: 'Criar banners' },
        { key: 'banners:edit', description: 'Editar banners' },
        { key: 'banners:delete', description: 'Excluir banners' },
      ],
    },
    {
      name: 'Administração',
      key: 'admin',
      permissions: [
        { key: 'users:view', description: 'Visualizar usuários' },
        { key: 'users:create', description: 'Criar usuários' },
        { key: 'users:edit', description: 'Editar usuários' },
        { key: 'users:delete', description: 'Excluir usuários' },
        { key: 'roles:manage', description: 'Gerenciar papéis e permissões' },
      ],
    },
  ];

  // Recuperar todos os permissões como lista plana
  const getAllPermissions = (): Permission[] => {
    return permissionCategories.flatMap(category => category.permissions);
  };
  
  // Buscar dados
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Buscar usuários
        const usersData = await api.get('/admin/users');
        setUsers(usersData);
        setFilteredUsers(usersData);
        
        // Buscar papéis
        const rolesData = await api.get('/admin/roles');
        setRoles(rolesData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as informações de permissões',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filtrar usuários conforme pesquisa
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      user => 
        user.nome.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.cargo?.toLowerCase().includes(query) ||
        user.departamento?.toLowerCase().includes(query)
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, users]);
  
  // Manipuladores de eventos
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };
  
  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsRoleDialogOpen(true);
  };
  
  const handleEditUserPermissions = (user: User) => {
    setSelectedUser(user);
    setIsPermissionDialogOpen(true);
  };
  
  const handleSaveUserRoles = async () => {
    if (!selectedUser) return;
    
    try {
      await api.put(`/admin/users/${selectedUser._id}/roles`, {
        roles: selectedUser.roles,
      });
      
      // Atualizar a lista de usuários
      setUsers(users.map(u => 
        u._id === selectedUser._id ? { ...u, roles: selectedUser.roles } : u
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Papéis do usuário atualizados com sucesso',
      });
      
      setIsUserDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar papéis do usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os papéis do usuário',
        variant: 'destructive',
      });
    }
  };
  
  const handleSaveUserPermissions = async () => {
    if (!selectedUser) return;
    
    try {
      await api.put(`/admin/users/${selectedUser._id}/permissions`, {
        permissions: selectedUser.permissions,
      });
      
      // Atualizar a lista de usuários
      setUsers(users.map(u => 
        u._id === selectedUser._id ? { ...u, permissions: selectedUser.permissions } : u
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Permissões do usuário atualizadas com sucesso',
      });
      
      setIsPermissionDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar permissões do usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as permissões do usuário',
        variant: 'destructive',
      });
    }
  };
  
  const handleSaveRole = async () => {
    if (!selectedRole) return;
    
    try {
      if (selectedRole._id) {
        // Atualizar papel existente
        await api.put(`/admin/roles/${selectedRole._id}`, selectedRole);
        
        // Atualizar a lista de papéis
        setRoles(roles.map(r => 
          r._id === selectedRole._id ? selectedRole : r
        ));
      } else {
        // Criar novo papel
        const newRole = await api.post('/admin/roles', selectedRole);
        setRoles([...roles, newRole]);
      }
      
      toast({
        title: 'Sucesso',
        description: `Papel ${selectedRole._id ? 'atualizado' : 'criado'} com sucesso`,
      });
      
      setIsRoleDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar papel:', error);
      toast({
        title: 'Erro',
        description: `Não foi possível ${selectedRole._id ? 'atualizar' : 'criar'} o papel`,
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este papel? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      await api.delete(`/admin/roles/${roleId}`);
      
      // Atualizar a lista de papéis
      setRoles(roles.filter(r => r._id !== roleId));
      
      toast({
        title: 'Sucesso',
        description: 'Papel excluído com sucesso',
      });
    } catch (error) {
      console.error('Erro ao excluir papel:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o papel',
        variant: 'destructive',
      });
    }
  };
  
  const handleCreateNewRole = () => {
    setSelectedRole({
      _id: '',
      name: '',
      description: '',
      permissions: [],
    });
    setIsRoleDialogOpen(true);
  };
  
  // Verificar se o usuário tem uma permissão
  const hasPermission = (userPermissions: string[], permission: string): boolean => {
    return userPermissions?.includes(permission) || false;
  };
  
  // Alternar permissão para o usuário selecionado
  const togglePermission = (permission: string) => {
    if (!selectedUser) return;
    
    const permissions = [...(selectedUser.permissions || [])];
    const index = permissions.indexOf(permission);
    
    if (index === -1) {
      permissions.push(permission);
    } else {
      permissions.splice(index, 1);
    }
    
    setSelectedUser({
      ...selectedUser,
      permissions,
    });
  };
  
  // Alternar permissão para o papel selecionado
  const toggleRolePermission = (permission: string) => {
    if (!selectedRole) return;
    
    const permissions = [...(selectedRole.permissions || [])];
    const index = permissions.indexOf(permission);
    
    if (index === -1) {
      permissions.push(permission);
    } else {
      permissions.splice(index, 1);
    }
    
    setSelectedRole({
      ...selectedRole,
      permissions,
    });
  };
  
  // Verificar se o papel tem uma permissão
  const roleHasPermission = (rolePermissions: string[], permission: string): boolean => {
    return rolePermissions?.includes(permission) || false;
  };
  
  // Verificar se o usuário tem um papel
  const hasRole = (userRoles: string[], roleName: string): boolean => {
    return userRoles?.includes(roleName) || false;
  };
  
  // Alternar papel para o usuário selecionado
  const toggleRole = (roleName: string) => {
    if (!selectedUser) return;
    
    const userRoles = [...(selectedUser.roles || [])];
    const index = userRoles.indexOf(roleName);
    
    if (index === -1) {
      userRoles.push(roleName);
    } else {
      userRoles.splice(index, 1);
    }
    
    setSelectedUser({
      ...selectedUser,
      roles: userRoles,
    });
  };
  
  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Permissões</h1>
      
      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="roles">Papéis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>
                Gerencie os papéis e permissões de cada usuário do sistema.
              </CardDescription>
              
              <div className="flex w-full items-center space-x-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email, cargo ou departamento"
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Limpar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Papéis</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        {searchQuery ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.nome}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.cargo}</TableCell>
                        <TableCell>{user.departamento}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((role) => (
                              <span
                                key={role}
                                className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-xs"
                              >
                                {role}
                              </span>
                            ))}
                            {!user.roles?.length && (
                              <span className="text-xs text-muted-foreground italic">
                                Sem papéis atribuídos
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              title="Editar papéis"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Papéis
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUserPermissions(user)}
                              title="Editar permissões"
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Permissões
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Papéis do Sistema</CardTitle>
                <CardDescription>
                  Gerencie os papéis e defina as permissões associadas a cada um.
                </CardDescription>
              </div>
              <Button onClick={handleCreateNewRole}>
                <Plus className="h-4 w-4 mr-1" />
                Novo Papel
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        Nenhum papel cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role._id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions?.length > 0 ? (
                              <span className="text-xs">
                                {role.permissions.length} permissões
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Sem permissões
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRole(role)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteRole(role._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Diálogo de edição de papéis do usuário */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Papéis do Usuário</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>
                  Defina os papéis para <strong>{selectedUser.nome}</strong> ({selectedUser.email}).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum papel disponível. Crie papéis primeiro.
              </p>
            ) : (
              roles.map((role) => (
                <div key={role._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role._id}`}
                    checked={hasRole(selectedUser?.roles || [], role.name)}
                    onCheckedChange={() => toggleRole(role.name)}
                  />
                  <Label
                    htmlFor={`role-${role._id}`}
                    className="flex flex-col cursor-pointer"
                  >
                    <span className="font-medium">{role.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {role.description}
                    </span>
                  </Label>
                </div>
              ))
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUserRoles}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de edição de permissões do usuário */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Permissões do Usuário</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>
                  Defina permissões específicas para <strong>{selectedUser.nome}</strong>.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {permissionCategories.map((category) => (
              <div key={category.key} className="mb-6">
                <h3 className="text-lg font-medium mb-2 pb-1 border-b">
                  {category.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {category.permissions.map((permission) => (
                    <div key={permission.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`permission-${permission.key}`}
                        checked={hasPermission(selectedUser?.permissions || [], permission.key)}
                        onCheckedChange={() => togglePermission(permission.key)}
                      />
                      <Label
                        htmlFor={`permission-${permission.key}`}
                        className="cursor-pointer text-sm"
                      >
                        {permission.description}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUserPermissions}>Salvar Permissões</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de edição de papel */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRole && selectedRole._id ? 'Editar Papel' : 'Novo Papel'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Nome do Papel</Label>
              <Input
                id="role-name"
                value={selectedRole?.name || ''}
                onChange={(e) => setSelectedRole({ ...selectedRole!, name: e.target.value })}
                placeholder="Ex: Editor, Gerente, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role-description">Descrição</Label>
              <Input
                id="role-description"
                value={selectedRole?.description || ''}
                onChange={(e) => setSelectedRole({ ...selectedRole!, description: e.target.value })}
                placeholder="Descreva o propósito deste papel"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Permissões</Label>
              <div className="max-h-[40vh] overflow-y-auto border rounded-md p-4">
                {permissionCategories.map((category) => (
                  <div key={category.key} className="mb-6">
                    <h3 className="text-sm font-medium mb-2 pb-1 border-b">
                      {category.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {category.permissions.map((permission) => (
                        <div key={permission.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-permission-${permission.key}`}
                            checked={roleHasPermission(selectedRole?.permissions || [], permission.key)}
                            onCheckedChange={() => toggleRolePermission(permission.key)}
                          />
                          <Label
                            htmlFor={`role-permission-${permission.key}`}
                            className="cursor-pointer text-sm"
                          >
                            {permission.description}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRole}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}