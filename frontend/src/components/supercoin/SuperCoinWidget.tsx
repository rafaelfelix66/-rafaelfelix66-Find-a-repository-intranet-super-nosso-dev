// frontend/src/components/supercoin/SuperCoinWidget.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, Send } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { superCoinsService, CoinBalance, RankingUser } from "@/services/superCoinsService";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/ui/user-avatar";
import { SuperCoinSendDialog } from "./SuperCoinSendDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SuperCoinWidget() {
  const { toast } = useToast();
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showRankingDialog, setShowRankingDialog] = useState(false);
  
  // Estado para o ranking
  const [rankingType, setRankingType] = useState<"received" | "given">("received");
  
  // Função para buscar o saldo
  const fetchBalance = async () => {
    try {
      console.log("Buscando saldo...");
      const data = await superCoinsService.getBalance();
      console.log("Saldo obtido:", data);
      setBalance(data);
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seu saldo de moedas",
        variant: "destructive"
      });
    }
  };
  
  // Função para buscar o ranking
  const fetchRanking = async (type = "received") => {
    try {
      console.log(`Buscando ranking de tipo: ${type}...`);
      const data = await superCoinsService.getRanking(type as "received" | "given");
      console.log(`Ranking obtido (${type}):`, data);
      setRanking(data);
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o ranking",
        variant: "destructive"
      });
    }
  };
  
  // Carregar saldo ao montar o componente
  useEffect(() => {
    fetchBalance();
  }, []);
  
  // Buscar ranking quando o diálogo for aberto ou o tipo mudar
  useEffect(() => {
    if (showRankingDialog) {
      fetchRanking(rankingType);
    }
  }, [showRankingDialog, rankingType]);
  
  // Função para mudar o tipo de ranking
  const handleRankingTypeChange = (type: string) => {
    setRankingType(type as "received" | "given");
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
      
      {/* Diálogo para enviar coins - Componente separado */}
      <SuperCoinSendDialog 
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        onSuccess={fetchBalance}
      />
      
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
                {ranking.length > 0 ? (
                  ranking.map((user, index) => (
                    <div key={user.userId} className="flex items-center p-3 border rounded-lg">
                      <div className="mr-3 font-bold text-lg text-gray-500 w-6 text-center">
                        {index + 1}
                      </div>
                      <UserAvatar 
                        user={{
                          name: user.userName,
                          avatar: user.userAvatar,
                          department: user.userDepartment
                        }}
                        size="md"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-medium">{user.userName}</p>
                        {user.userDepartment && (
                          <p className="text-xs text-gray-500">{user.userDepartment}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-500">{user.totalPoints}</p>
                        <p className="text-xs text-gray-500">moedas</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>Nenhum resultado disponível</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="given" className="pt-4">
              <div className="space-y-4">
                {ranking.length > 0 ? (
                  ranking.map((user, index) => (
                    <div key={user.userId} className="flex items-center p-3 border rounded-lg">
                      <div className="mr-3 font-bold text-lg text-gray-500 w-6 text-center">
                        {index + 1}
                      </div>
                      <UserAvatar 
                        user={{
                          name: user.userName,
                          avatar: user.userAvatar,
                          department: user.userDepartment
                        }}
                        size="md"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-medium">{user.userName}</p>
                        {user.userDepartment && (
                          <p className="text-xs text-gray-500">{user.userDepartment}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-500">{user.totalPoints}</p>
                        <p className="text-xs text-gray-500">moedas</p>
                      </div>
                    </div>
                  ))
                ) : (
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