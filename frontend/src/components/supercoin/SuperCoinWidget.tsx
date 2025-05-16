//frontend/src/components/supercoin/SuperCoinWidget.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, Send, Gift } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/services/api";
import { Badge } from "@/components/ui/badge";

interface CoinBalance {
  balance: number;
  totalReceived: number;
  totalGiven: number;
}

export function SuperCoinWidget() {
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showRankingDialog, setShowRankingDialog] = useState(false);
  
  const fetchBalance = async () => {
    try {
      const response = await api.get('/supercoins/balance');
      setBalance(response);
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
    }
  };
  
  useEffect(() => {
    fetchBalance();
  }, []);
  
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Super Coins</DialogTitle>
          </DialogHeader>
          {/* Implementar formulário de envio */}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para ranking */}
      <Dialog open={showRankingDialog} onOpenChange={setShowRankingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ranking Super Coins</DialogTitle>
          </DialogHeader>
          {/* Implementar ranking */}
        </DialogContent>
      </Dialog>
    </>
  );
}