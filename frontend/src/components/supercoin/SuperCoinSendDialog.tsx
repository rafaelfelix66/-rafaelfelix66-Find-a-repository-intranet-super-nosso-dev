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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info, Search, X } from "lucide-react";
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
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
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
  
  // Estado para o filtro de nome
  const [nameFilter, setNameFilter] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  
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
      setFilteredUsers(filteredUsers);
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
  
  // Filtrar usuários por nome
  useEffect(() => {
    if (nameFilter.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.nome.toLowerCase().includes(nameFilter.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [nameFilter, users]);
  
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
      setNameFilter("");
      setShowUserList(false);
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
  
  // Função para selecionar usuário
  const selectUser = (user: User) => {
    setSelectedUser(user._id);
    setNameFilter(user.nome);
    setShowUserList(false);
  };
  
  // Função para limpar seleção de usuário
  const clearUserSelection = () => {
    setSelectedUser("");
    setNameFilter("");
    setShowUserList(false);
  };
  
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
  
  const getSelectedUserName = () => {
    const user = users.find(u => u._id === selectedUser);
    return user ? user.nome : "";
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
          {/* Campo de filtro por nome */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Destinatário</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite o nome do destinatário..."
                  value={nameFilter}
                  onChange={(e) => {
                    setNameFilter(e.target.value);
                    setShowUserList(true);
                    if (e.target.value === "") {
                      setSelectedUser("");
                    }
                  }}
                  onFocus={() => setShowUserList(true)}
                  onBlur={() => {
                    // Delay para permitir cliques na lista
                    setTimeout(() => setShowUserList(false), 200);
                  }}
                  className="pl-10 pr-10"
                  disabled={initialLoading}
                />
                {selectedUser && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={clearUserSelection}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Lista de usuários filtrados */}
              {showUserList && !selectedUser && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <div
                        key={user._id}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => selectUser(user)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{user.nome}</span>
                          {user.departamento && (
                            <Badge variant="outline" className="text-xs">
                              {user.departamento}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      {nameFilter ? "Nenhum usuário encontrado" : "Carregando usuários..."}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Mostrar usuário selecionado */}
            {selectedUser && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-800">{getSelectedUserName()}</span>
                    {users.find(u => u._id === selectedUser)?.departamento && (
                      <Badge variant="outline" className="text-xs">
                        {users.find(u => u._id === selectedUser)?.departamento}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                    onClick={clearUserSelection}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Seleção de atributo */}
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
                        {attr.cost} moedas
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
          
          {/* Campo de mensagem (condicional) */}
          {canSendMessage && (
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
          )}
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