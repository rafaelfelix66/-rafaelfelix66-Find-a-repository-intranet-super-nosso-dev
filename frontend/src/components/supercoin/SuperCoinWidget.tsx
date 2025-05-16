// frontend/src/components/supercoin/SuperCoinWidget.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, Send, Gift, UserPlus } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/ui/user-avatar";

interface CoinBalance {
  balance: number;
  totalReceived: number;
  totalGiven: number;
}

interface CoinAttribute {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  color: string;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  department?: string;
  cargo?: string;
}

interface Transaction {
  id: string;
  fromUser: User;
  toUser: User;
  amount: number;
  attribute: CoinAttribute;
  message: string;
  timestamp: string;
}

interface RankingUser {
  id: string;
  name: string;
  department?: string;
  avatar?: string;
  coins: number;
}

export function SuperCoinWidget() {
  const { toast } = useToast();
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [attributes, setAttributes] = useState<CoinAttribute[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showRankingDialog, setShowRankingDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para o formulário de envio
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedAttribute, setSelectedAttribute] = useState("");
  const [message, setMessage] = useState("");
  
  // Estados para o ranking
  const [rankingType, setRankingType] = useState("received");
  
  const fetchBalance = async () => {
    try {
      const response = await api.get('/supercoins/balance');
      setBalance(response);
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
    }
  };
  
  const fetchAttributes = async () => {
    try {
      const response = await api.get('/supercoins/attributes');
      setAttributes(response);
    } catch (error) {
      console.error('Erro ao buscar atributos:', error);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const response = await api.get('/usuarios');
      setUsers(response);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };
  
  const fetchTransactions = async () => {
    try {
      const response = await api.get('/supercoins/transactions');
      setTransactions(response);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    }
  };
  
  const fetchRanking = async (type = "received") => {
    try {
      const response = await api.get(`/supercoins/ranking?type=${type}`);
      setRanking(response);
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
    }
  };
  
  useEffect(() => {
    fetchBalance();
  }, []);
  
  // Buscar dados adicionais quando os diálogos forem abertos
  useEffect(() => {
    if (showSendDialog) {
      fetchAttributes();
      fetchUsers();
    }
    
    if (showRankingDialog) {
      fetchRanking(rankingType);
    }
  }, [showSendDialog, showRankingDialog, rankingType]);
  
  const handleSendCoins = async () => {
    if (!selectedUser || !selectedAttribute) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um destinatário e um atributo",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      await api.post('/supercoins/send', {
        toUserId: selectedUser,
        attributeId: selectedAttribute,
        message
      });
      
      toast({
        title: "Moedas enviadas",
        description: "As Super Coins foram enviadas com sucesso!"
      });
      
      // Atualizar saldo após enviar
      fetchBalance();
      
      // Fechar o diálogo e limpar o formulário
      setShowSendDialog(false);
      setSelectedUser("");
      setSelectedAttribute("");
      setMessage("");
      
    } catch (error) {
      console.error('Erro ao enviar moedas:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível enviar as moedas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRankingTypeChange = (type: string) => {
    setRankingType(type);
    fetchRanking(type);
  };
  
  const getCostText = (attributeId: string) => {
    const attr = attributes.find(a => a.id === attributeId);
    return attr ? `${attr.cost} moedas` : "";
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Super Coins
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-500">
              {balance?.balance || 0}
            </p>
            <p className="text-sm text-gray-500">Saldo disponível</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-center p-2 bg-green-50 rounded">
              <p className="font-medium text-green-700">{balance?.totalReceived || 0}</p>
              <p className="text-xs text-gray-600">Recebidas</p>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <p className="font-medium text-blue-700">{balance?.totalGiven || 0}</p>
              <p className="text-xs text-gray-600">Enviadas</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => setShowSendDialog(true)}
            >
              <Send className="mr-1 h-4 w-4" />
              Enviar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => setShowRankingDialog(true)}
            >
              <TrendingUp className="mr-1 h-4 w-4" />
              Ranking
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Diálogo para enviar coins */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Super Coins</DialogTitle>
            <DialogDescription>
              Reconheça um colega enviando Super Coins por suas qualidades
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Destinatário</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um destinatário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center">
                        <span>{user.name}</span>
                        {user.department && (
                          <Badge variant="outline" className="ml-2">
                            {user.department}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="attribute">Atributo</Label>
              <Select value={selectedAttribute} onValueChange={setSelectedAttribute}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um atributo" />
                </SelectTrigger>
                <SelectContent>
                  {attributes.map(attr => (
                    <SelectItem key={attr.id} value={attr.id}>
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: attr.color }}
                        ></div>
                        <span>{attr.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {attr.cost} coins
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAttribute && (
                <p className="text-xs text-gray-500">
                  Custo: {getCostText(selectedAttribute)}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem (opcional)</Label>
              <Textarea
                id="message"
                placeholder="Deixe uma mensagem de reconhecimento..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendCoins} 
              disabled={loading || !selectedUser || !selectedAttribute}
            >
              {loading ? "Enviando..." : "Enviar Moedas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para ranking */}
      <Dialog open={showRankingDialog} onOpenChange={setShowRankingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ranking Super Coins</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="received" value={rankingType} onValueChange={handleRankingTypeChange}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="received">Mais Recebidas</TabsTrigger>
              <TabsTrigger value="given">Mais Enviadas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="received" className="pt-4">
              <div className="space-y-4">
                {ranking.map((user, index) => (
                  <div key={user.id} className="flex items-center p-3 border rounded-lg">
                    <div className="mr-3 font-bold text-lg text-gray-500 w-6 text-center">
                      {index + 1}
                    </div>
                    <UserAvatar 
                      user={{
                        name: user.name,
                        avatar: user.avatar,
                        department: user.department
                      }}
                      size="md"
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-medium">{user.name}</p>
                      {user.department && (
                        <p className="text-xs text-gray-500">{user.department}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-500">{user.coins}</p>
                      <p className="text-xs text-gray-500">moedas</p>
                    </div>
                  </div>
                ))}
                
                {ranking.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <p>Nenhum resultado disponível</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="given" className="pt-4">
              <div className="space-y-4">
                {ranking.map((user, index) => (
                  <div key={user.id} className="flex items-center p-3 border rounded-lg">
                    <div className="mr-3 font-bold text-lg text-gray-500 w-6 text-center">
                      {index + 1}
                    </div>
                    <UserAvatar 
                      user={{
                        name: user.name,
                        avatar: user.avatar,
                        department: user.department
                      }}
                      size="md"
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-medium">{user.name}</p>
                      {user.department && (
                        <p className="text-xs text-gray-500">{user.department}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-500">{user.coins}</p>
                      <p className="text-xs text-gray-500">moedas</p>
                    </div>
                  </div>
                ))}
                
                {ranking.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <p>Nenhum resultado disponível</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}