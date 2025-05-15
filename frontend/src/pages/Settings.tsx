// src/pages/Settings.tsx
import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Camera, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Settings() {
  const { toast } = useToast();
  const { user, updateUser, uploadAvatar, removeAvatar } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateUser({ email });
    } catch (error) {
      // Erro já tratado no contexto
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tamanho
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }
    
    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo inválido",
        description: "Apenas imagens JPG, PNG, GIF e WebP são permitidas.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await uploadAvatar(file);
    } catch (error) {
      // Erro já tratado no contexto
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveAvatar = async () => {
    if (!confirm("Tem certeza que deseja remover sua foto de perfil?")) return;
    
    try {
      setIsLoading(true);
      await removeAvatar();
    } catch (error) {
      // Erro já tratado no contexto
    } finally {
      setIsLoading(false);
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Não informado";
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Configurações</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Perfil do Usuário</CardTitle>
                <CardDescription>
                  Visualize suas informações pessoais e atualize seu email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage 
                        src={user?.avatar} 
                        alt={user?.name}
                      />
                      <AvatarFallback className="bg-[#e60909] text-white text-2xl">
                        {getInitials(user?.name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute bottom-0 right-0 rounded-full p-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user?.name}</h3>
                    <p className="text-sm text-gray-500">CPF: {user?.cpf}</p>
                    {user?.avatar && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={isLoading}
                        className="mt-2"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remover foto
                      </Button>
                    )}
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                
                {/* Informações pessoais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome completo</Label>
                    <Input value={user?.name || ""} disabled />
                  </div>
                                                
                  <div className="space-y-2">
                    <Label>Chapa</Label>
                    <Input value={user?.chapa || "Não informado"} disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input value={user?.cargo || "Não informado"} disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Departamento</Label>
                    <Input value={user?.department || "Não informado"} disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Filial</Label>
                    <Input value={user?.filial || "Não informado"} disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Data de Admissão</Label>
                    <Input value={formatDate(user?.dataAdmissao)} disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <Input value={formatDate(user?.dataNascimento)} disabled />
                  </div>
                </div>
                
                {/* Email editável */}
                <form onSubmit={handleSaveEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@empresa.com.br"
                    />
                    <p className="text-sm text-gray-500">
                      Este é o único campo que pode ser editado manualmente.
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      type="submit" 
                      className="bg-supernosso-red hover:bg-supernosso-red/90" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Salvar email"
                      )}
                    </Button>
                  </div>
                </form>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">
                    <strong>Nota:</strong> As informações pessoais são sincronizadas automaticamente 
                    com o sistema corporativo através do job de sincronização que executa diariamente às 2:00 AM.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}