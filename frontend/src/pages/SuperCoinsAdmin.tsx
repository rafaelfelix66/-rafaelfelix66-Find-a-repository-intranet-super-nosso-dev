// frontend/src/pages/SuperCoinsAdmin.tsx
import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { 
  Coins, 
  CreditCard, 
  Trash2, 
  Edit, 
  Plus, 
  Calendar, 
  BarChart4,
  RefreshCw,
  Check,
  AlertCircle,
  Settings2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CoinAttribute {
  _id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  color: string;
  active: boolean;
}

interface CoinConfig {
  _id: string;
  monthlyRechargeAmount: number;
  rechargeDay: number;
  rechargeMode: 'reset' | 'complement';
}

interface SystemStats {
  usersWithBalance: number;
  totalCoins: number;
  totalTransactions: number;
  totalAttributes: number;
  recentTransactions: number;
  totalAmount: number;
}

const SuperCoinsAdmin: React.FC = () => {
  const { toast } = useToast();
  const [attributes, setAttributes] = useState<CoinAttribute[]>([]);
  const [config, setConfig] = useState<CoinConfig | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [rechargeLoading, setRechargeLoading] = useState(false);

  // Estados para o diálogo de atributo
  const [showAttributeDialog, setShowAttributeDialog] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<CoinAttribute | null>(null);
  const [attributeName, setAttributeName] = useState("");
  const [attributeDescription, setAttributeDescription] = useState("");
  const [attributeCost, setAttributeCost] = useState("");
  const [attributeColor, setAttributeColor] = useState("#e60909");
  const [attributeActive, setAttributeActive] = useState(true);

  // Estados para configurações
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeDay, setRechargeDay] = useState("");
  const [rechargeMode, setRechargeMode] = useState<"reset" | "complement">("reset");

  // Buscar atributos
  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/supercoins/attributes');
      setAttributes(response);
    } catch (error) {
      console.error('Erro ao buscar atributos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os atributos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar configurações
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/supercoins/config');
      setConfig(response);
      setRechargeAmount(response.monthlyRechargeAmount.toString());
      setRechargeDay(response.rechargeDay.toString());
      setRechargeMode(response.rechargeMode);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar estatísticas
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/supercoins/stats');
      setStats(response);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchAttributes();
    fetchConfig();
    fetchStats();
  }, []);

  // Manipuladores para atributos
  const handleCreateAttribute = () => {
    setSelectedAttribute(null);
    setAttributeName("");
    setAttributeDescription("");
    setAttributeCost("10");
    setAttributeColor("#e60909");
    setAttributeActive(true);
    setShowAttributeDialog(true);
  };

  const handleEditAttribute = (attribute: CoinAttribute) => {
    setSelectedAttribute(attribute);
    setAttributeName(attribute.name);
    setAttributeDescription(attribute.description || "");
    setAttributeCost(attribute.cost.toString());
    setAttributeColor(attribute.color || "#e60909");
    setAttributeActive(attribute.active);
    setShowAttributeDialog(true);
  };

  const handleSaveAttribute = async () => {
    if (!attributeName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do atributo é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!attributeCost || isNaN(Number(attributeCost)) || Number(attributeCost) < 1) {
      toast({
        title: "Valor inválido",
        description: "O custo deve ser um número maior que zero",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const attributeData = {
        name: attributeName.trim(),
        description: attributeDescription.trim(),
        cost: Number(attributeCost),
        color: attributeColor,
        active: attributeActive
      };

      if (selectedAttribute) {
        // Atualizar atributo existente
        await api.put(`/supercoins/attributes/${selectedAttribute._id}`, attributeData);
        toast({
          title: "Atributo atualizado",
          description: "O atributo foi atualizado com sucesso"
        });
      } else {
        // Criar novo atributo
        await api.post('/supercoins/attributes', attributeData);
        toast({
          title: "Atributo criado",
          description: "O atributo foi criado com sucesso"
        });
      }

      // Recarregar a lista de atributos
      fetchAttributes();
      setShowAttributeDialog(false);
    } catch (error) {
      console.error('Erro ao salvar atributo:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível salvar o atributo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este atributo?")) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/supercoins/attributes/${id}`);
      toast({
        title: "Atributo excluído",
        description: "O atributo foi excluído com sucesso"
      });
      fetchAttributes();
    } catch (error) {
      console.error('Erro ao excluir atributo:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir o atributo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Manipuladores para configurações
  const handleSaveConfig = async () => {
    if (!rechargeAmount || isNaN(Number(rechargeAmount)) || Number(rechargeAmount) < 0) {
      toast({
        title: "Valor inválido",
        description: "O valor de recarga deve ser um número maior ou igual a zero",
        variant: "destructive"
      });
      return;
    }

    if (!rechargeDay || isNaN(Number(rechargeDay)) || Number(rechargeDay) < 1 || Number(rechargeDay) > 28) {
      toast({
        title: "Valor inválido",
        description: "O dia de recarga deve ser um número entre 1 e 28",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await api.put('/supercoins/config', {
        monthlyRechargeAmount: Number(rechargeAmount),
        rechargeDay: Number(rechargeDay),
        rechargeMode
      });
      
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso"
      });
      
      fetchConfig();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Executar recarga manual
  const handleManualRecharge = async () => {
    if (!confirm("Tem certeza que deseja executar a recarga manual? Esta operação pode afetar o saldo de todos os usuários.")) {
      return;
    }

    try {
      setRechargeLoading(true);
      const result = await api.post('/supercoins/recharge');
      
      toast({
        title: "Recarga executada",
        description: result.message || "A recarga manual foi executada com sucesso"
      });
      
      // Atualizar estatísticas
      fetchStats();
    } catch (error) {
      console.error('Erro ao executar recarga manual:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível executar a recarga manual",
        variant: "destructive"
      });
    } finally {
      setRechargeLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <Coins className="mr-2 h-6 w-6 text-yellow-500" />
            Administração de Super Coins
          </h1>
        </div>

        <Tabs defaultValue="attributes">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="attributes">Atributos</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          {/* Aba de Atributos */}
          <TabsContent value="attributes" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl">Atributos</CardTitle>
                  <CardDescription>
                    Gerencie os atributos disponíveis para envio de moedas
                  </CardDescription>
                </div>
                <Button onClick={handleCreateAttribute}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Atributo
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                    <p className="mt-2 text-gray-500">Carregando atributos...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cor</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Custo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attributes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            Nenhum atributo encontrado. Crie um novo atributo para começar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        attributes.map((attribute) => (
                          <TableRow key={attribute._id}>
                            <TableCell>
                              <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: attribute.color || "#e60909" }}
                              ></div>
                            </TableCell>
                            <TableCell className="font-medium">{attribute.name}</TableCell>
                            <TableCell>
                              {attribute.description || 
                               <span className="text-gray-400 italic">Sem descrição</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{attribute.cost} coins</Badge>
                            </TableCell>
                            <TableCell>
                              {attribute.active ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">
                                  Inativo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditAttribute(attribute)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600 hover:text-red-800"
                                  onClick={() => handleDeleteAttribute(attribute._id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Configurações */}
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Configurações de Recarga</CardTitle>
                <CardDescription>
                  Configure como o sistema realiza recargas automáticas de moedas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                    <p className="mt-2 text-gray-500">Carregando configurações...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="rechargeAmount">Quantidade de moedas para recarga mensal</Label>
                        <Input
                          id="rechargeAmount"
                          type="number"
                          min="0"
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          placeholder="Ex: 100"
                        />
                        <p className="text-sm text-gray-500">
                          Quantidade de moedas que cada usuário receberá mensalmente
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="rechargeDay">Dia do mês para recarga</Label>
                        <Input
                          id="rechargeDay"
                          type="number"
                          min="1"
                          max="28"
                          value={rechargeDay}
                          onChange={(e) => setRechargeDay(e.target.value)}
                          placeholder="Ex: 1"
                        />
                        <p className="text-sm text-gray-500">
                          Dia do mês em que a recarga automática será executada (1-28)
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="rechargeMode">Modo de recarga</Label>
                      <Select
                        value={rechargeMode}
                        onValueChange={(value: "reset" | "complement") => setRechargeMode(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o modo de recarga" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reset">
                            Redefinir (sempre define o saldo para o valor configurado)
                          </SelectItem>
                          <SelectItem value="complement">
                            Complementar (adiciona apenas o necessário para atingir o valor)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">
                        No modo "Redefinir", o saldo sempre será definido para o valor configurado.
                        No modo "Complementar", apenas a diferença será adicionada para atingir o valor configurado.
                      </p>
                    </div>
                    
                    <div className="pt-4 flex justify-between items-center">
                      <Button onClick={handleSaveConfig} disabled={loading}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        Salvar Configurações
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={handleManualRecharge}
                        disabled={rechargeLoading}
                      >
                        {rechargeLoading ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-b-2 rounded-full border-current"></div>
                            Processando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Executar Recarga Manual
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <Alert className="mt-6 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-800" />
                      <AlertTitle className="text-yellow-800">Atenção</AlertTitle>
                      <AlertDescription className="text-yellow-800">
                        A recarga manual afetará o saldo de todos os usuários de acordo com as 
                        configurações acima. Use esta função com cuidado.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Estatísticas */}
          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Estatísticas do Sistema</CardTitle>
                <CardDescription>
                  Visão geral do uso de Super Coins na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                    <p className="mt-2 text-gray-500">Carregando estatísticas...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center text-center">
                          <Coins className="h-8 w-8 text-yellow-500 mb-2" />
                          <p className="text-3xl font-bold">{stats?.totalCoins || 0}</p>
                          <p className="text-sm text-gray-500">Moedas em Circulação</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center text-center">
                          <CreditCard className="h-8 w-8 text-blue-500 mb-2" />
                          <p className="text-3xl font-bold">{stats?.totalTransactions || 0}</p>
                          <p className="text-sm text-gray-500">Total de Transações</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center text-center">
                          <BarChart4 className="h-8 w-8 text-green-500 mb-2" />
                          <p className="text-3xl font-bold">{stats?.recentTransactions || 0}</p>
                          <p className="text-sm text-gray-500">Transações Recentes (30 dias)</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center text-center">
                          <Calendar className="h-8 w-8 text-purple-500 mb-2" />
                          <p className="text-3xl font-bold">{stats?.usersWithBalance || 0}</p>
                          <p className="text-sm text-gray-500">Usuários com Saldo</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center text-center">
                          <Coins className="h-8 w-8 text-indigo-500 mb-2" />
                          <p className="text-3xl font-bold">{stats?.totalAmount || 0}</p>
                          <p className="text-sm text-gray-500">Total de Moedas Transferidas</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center text-center">
                          <Check className="h-8 w-8 text-green-600 mb-2" />
                          <p className="text-3xl font-bold">{stats?.totalAttributes || 0}</p>
                          <p className="text-sm text-gray-500">Atributos Disponíveis</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo para criar/editar atributo */}
      <Dialog open={showAttributeDialog} onOpenChange={setShowAttributeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedAttribute ? "Editar Atributo" : "Novo Atributo"}
            </DialogTitle>
            <DialogDescription>
              {selectedAttribute 
                ? "Edite as informações do atributo existente"
                : "Preencha as informações para criar um novo atributo"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={attributeName}
                onChange={(e) => setAttributeName(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Colaboração"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">
                Custo
              </Label>
              <Input
                id="cost"
                type="number"
                min="1"
                value={attributeCost}
                onChange={(e) => setAttributeCost(e.target.value)}
                className="col-span-3"
                placeholder="Ex: 10"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Cor
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={attributeColor}
                  onChange={(e) => setAttributeColor(e.target.value)}
                  className="w-20 h-10"
                />
                <div
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: attributeColor }}
                ></div>
                <Input
                  value={attributeColor}
                  onChange={(e) => setAttributeColor(e.target.value)}
                  className="flex-1"
                  placeholder="#e60909"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={attributeDescription}
                onChange={(e) => setAttributeDescription(e.target.value)}
                className="col-span-3"
                placeholder="Descreva este atributo"
                rows={3}
              />
            </div>
            {selectedAttribute && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">
                  Status
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="active"
                    checked={attributeActive}
                    onCheckedChange={setAttributeActive}
                  />
                  <Label htmlFor="active" className="cursor-pointer">
                    {attributeActive ? "Ativo" : "Inativo"}
                  </Label>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAttributeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAttribute} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-b-2 rounded-full border-current"></div>
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SuperCoinsAdmin;