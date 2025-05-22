// frontend/src/components/supercoin/SuperCoinSendDialog.tsx - Com verificação de saldo
import React, { useState, useEffect } from 'react';
import { Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { superCoinsService, CoinAttribute, CoinBalance } from '@/services/superCoinsService';
import { api } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';

interface User {
  _id: string;
  nome: string;
  departamento?: string;
}

interface SuperCoinSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SuperCoinSendDialog({ 
  open, 
  onOpenChange,
  onSuccess
}: SuperCoinSendDialogProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [users, setUsers] = useState<User[]>([]);
  const [attributes, setAttributes] = useState<CoinAttribute[]>([]);
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Estado para controlar se o usuário pode enviar mensagens
  const canSendMessage = hasPermission('supercoins:send_message');
  
  // Estados para o formulário
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedAttribute, setSelectedAttribute] = useState("");
  const [message, setMessage] = useState("");
  
  // Estados para controle de erros de saldo
  const [selectedCost, setSelectedCost] = useState(0);
  const [hasInsufficientBalance, setHasInsufficientBalance] = useState(false);
  
  // Buscar usuários
  const fetchUsers = async () => {
    try {
      const response = await api.get('/usuarios');
      // Filtrar o usuário atual da lista
      const currentUserId = localStorage.getItem('userId');
      const filteredUsers = response.filter(user => user._id !== currentUserId);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive"
      });
    }
  };
  
  // Buscar atributos
  const fetchAttributes = async () => {
    try {
      const attributes = await superCoinsService.getAttributes();
      setAttributes(attributes);
    } catch (error) {
      console.error('Erro ao buscar atributos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os atributos",
        variant: "destructive"
      });
    }
  };
  
  // Buscar saldo
  const fetchBalance = async () => {
    try {
      const balanceData = await superCoinsService.getBalance();
      setBalance(balanceData);
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
    }
  };
  
  // Carregar dados quando o diálogo abrir
  useEffect(() => {
    if (open) {
      setInitialLoading(true);
      
      Promise.all([
        fetchUsers(),
        fetchAttributes(),
        fetchBalance()
      ]).finally(() => {
        setInitialLoading(false);
      });
    }
  }, [open]);
  
  // Limpar formulário quando fecha
  useEffect(() => {
    if (!open) {
      setSelectedUser("");
      setSelectedAttribute("");
      setMessage("");
      setSelectedCost(0);
      setHasInsufficientBalance(false);
    }
  }, [open]);
  
  // Verificar se o atributo selecionado é maior que o saldo
  useEffect(() => {
    if (selectedAttribute && balance) {
      const attr = attributes.find(a => a._id === selectedAttribute);
      if (attr) {
        setSelectedCost(attr.cost);
        setHasInsufficientBalance(attr.cost > (balance.balance || 0));
      }
    }
  }, [selectedAttribute, balance, attributes]);
  
  // Função para enviar moedas
  const handleSendCoins = async () => {
    if (!selectedUser || !selectedAttribute) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um destinatário e um atributo",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar saldo novamente antes de enviar
    if (hasInsufficientBalance) {
      toast({
        title: "Saldo insuficiente",
        description: `Você precisa de ${selectedCost} moedas para enviar este atributo`,
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Usar o serviço para enviar moedas
      await superCoinsService.sendCoins({
        toUserId: selectedUser,
        attributeId: selectedAttribute,
        message: message.trim() || undefined
      });
      
      toast({
        title: "Moedas enviadas",
        description: "As Super Coins foram enviadas com sucesso!"
      });
      
      // Fechar o diálogo e limpar o formulário
      onOpenChange(false);
      
      // Callback de sucesso (para atualizar saldo, etc.)
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      let errorMessage = "Não foi possível enviar as moedas";
      
      // Tentar extrair mensagem específica do erro
      if (error instanceof Error) {
        if (error.message.includes("Saldo insuficiente")) {
          errorMessage = "Saldo insuficiente para enviar estas moedas";
        } else {
          errorMessage = error.message;
        }
      }
      
      console.error('Erro ao enviar moedas:', error);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getCostText = (attributeId: string) => {
    const attr = attributes.find(a => a._id === attributeId);
    return attr ? `${attr.cost} moedas` : "";
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Super Coins</DialogTitle>
          <DialogDescription>
            Reconheça um colega enviando Super Coins por suas qualidades
          </DialogDescription>
        </DialogHeader>
        
        {/* Mostrar saldo atual */}
        <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Seu saldo atual:</span>
          </div>
          <span className="font-medium text-yellow-600">{balance?.balance || 0} moedas</span>
        </div>
        
        {/* Alerta de saldo insuficiente */}
        {hasInsufficientBalance && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Saldo insuficiente</AlertTitle>
            <AlertDescription>
              Você precisa de {selectedCost} moedas para enviar este atributo, mas possui apenas {balance?.balance || 0}.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Destinatário</Label>
            <Select 
              value={selectedUser} 
              onValueChange={setSelectedUser}
              disabled={initialLoading || users.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  initialLoading 
                    ? "Carregando usuários..." 
                    : users.length === 0
                    ? "Nenhum usuário disponível"
                    : "Selecione um destinatário"
                } />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user._id} value={user._id}>
                    <div className="flex items-center">
                      <span>{user.nome}</span>
                      {user.departamento && (
                        <Badge variant="outline" className="ml-2">
                          {user.departamento}
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
            <Select 
              value={selectedAttribute} 
              onValueChange={setSelectedAttribute}
              disabled={initialLoading || attributes.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  initialLoading 
                    ? "Carregando atributos..." 
                    : attributes.length === 0
                    ? "Nenhum atributo disponível"
                    : "Selecione um atributo"
                } />
              </SelectTrigger>
              <SelectContent>
                {attributes.map(attr => (
                  <SelectItem 
                    key={attr._id} 
                    value={attr._id} 
                    disabled={attr.cost > (balance?.balance || 0)}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: attr.color || "#e60909" }}
                      ></div>
                      <span>{attr.name}</span>
                      <Badge 
                        variant={attr.cost > (balance?.balance || 0) ? "destructive" : "outline"} 
                        className="ml-2"
                      >
                        {attr.cost} coins
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAttribute && (
              <p className={`text-xs ${hasInsufficientBalance ? 'text-red-500' : 'text-gray-500'}`}>
                Custo: {getCostText(selectedAttribute)}
              </p>
            )}
          </div>
          
          {/* Campo de mensagem (oculto se usuário não tem permissão) */}
          {canSendMessage ? (
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
          ) : null}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSendCoins} 
            disabled={loading || !selectedUser || !selectedAttribute || hasInsufficientBalance}
          >
            {loading ? "Enviando..." : "Enviar Moedas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}