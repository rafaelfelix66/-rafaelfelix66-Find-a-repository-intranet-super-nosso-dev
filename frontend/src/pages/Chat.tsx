// src/pages/Chat.tsx - VERSÃO COMPLETAMENTE CORRIGIDA
import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/services/api";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Send, 
  MessageCircle, 
  AlertCircle, 
  Loader2,
  FileQuestion,
  Database,
  Menu,
  X,
  RefreshCw,
  Download,
  ExternalLink,
  FileText,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { llmService, ChatMessage, LLMStatus } from "@/services/llmService";
import ReactMarkdown from 'react-markdown';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

// Interface para arquivos RAG (apenas o necessário para o chat)
interface RAGFile {
  id: string;
  name: string;
  description?: string;
  type: 'file' | 'folder' | 'link';
  size?: string;
  allowRAG: boolean;
  allowDownload?: boolean;
  linkUrl?: string;
  mimeType?: string;
  extension?: string;
}

const Chat = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [llmStatus, setLlmStatus] = useState<LLMStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);
  const [isStatusChecking, setIsStatusChecking] = useState(false);
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [userFiles, setUserFiles] = useState<RAGFile[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [gabiUser, setGabiUser] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);


  // Avatar da Gabi
  const getGabiAvatar = () => {
    if (gabiUser && gabiUser.avatar) {
      return gabiUser.avatar;
    }
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNmM2Y0ZjYiLz48cGF0aCBkPSJNMjAgMjVjMC04IDEwLTE1IDMwLTE1czMwIDcgMzAgMTVjMCA4LTEwIDE1LTMwIDE1cy0zMC03LTMwLTE1eiIgZmlsbD0iIzNlMmIxOSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDUiIHI9IjIwIiBmaWxsPSIjZjJjNjc0Ii8+PGVsbGlwc2UgY3g9IjQzIiBjeT0iNDIiIHJ4PSI0IiByeT0iNiIgZmlsbD0iIzJkM2E0ZiIvPjxlbGxpcHNlIGN4PSI1NyIgY3k9IjQyIiByeD0iNCIgcnk9IjYiIGZpbGw9IiMyZDNhNGYiLz48ZWxsaXBzZSBjeD0iNTAiIGN5PSI0OCIgcng9IjIiIHJ5PSIxIiBmaWxsPSIjZjJjNjc0Ii8+PHBhdGggZD0iTTQ1IDUyYzMgMyA3IDMgMTAgMGMtMyAzLTcgMy0xMCAwIiBzdHJva2U9IiNkNjM0NGYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTMwIDY1YzUgLTUgMTUtNSAyMCAwczE1IDUgMjAgMGwwIDE1bC00MCAway0wIC0xNXoiIGZpbGw9IiNmZmQ3MDAiLz48L3N2Zz4=";
  };
  
  const getGabiAvatar2 = () => {
    return "/Gabi.png";
  };
  
  // Limpar chat
  const handleClearChat = () => {
    setMessages([
      {
        id: "system-1",
        sender: "system",
        text: "Olá! Eu sou a Gabi, sua assistente virtual da Intranet Super Nosso. " +
              "Estou integrada com o sistema RAG e posso responder perguntas sobre os documentos " +
              "da sua biblioteca de arquivos. Em que posso ajudar você hoje?",
        timestamp: new Date()
      }
    ]);
    setMessageInput("");
    setSearchQuery("");
  };
  
  // Verificar status do LLM ao carregar o componente
  useEffect(() => {
    checkLLMStatus();
    fetchGabiUser();
    
    setMessages([
      {
        id: "system-1",
        sender: "system",
        text: "Olá! Eu sou a Gabi, sua assistente virtual da Intranet Super Nosso. " +
              "Estou integrada com o sistema RAG e posso responder perguntas sobre os documentos " +
              "da sua biblioteca de arquivos. Em que posso ajudar você hoje?",
        timestamp: new Date()
      }
    ]);
    
    fetchUserFiles();
  }, []);
  
  // Atualizar mensagens filtradas quando o filtro mudar
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMessages(messages);
      return;
    }
    
    const filtered = messages.filter(msg => 
      msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredMessages(filtered);
  }, [searchQuery, messages]);
  
  // Detectar quando usuário está scrollando manualmente
useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setIsAtBottom(isNearBottom);
    
    // Se não está no final, usuário está navegando
    if (!isNearBottom) {
      setIsUserScrolling(true);
      
      // Limpar timeout anterior
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Após 3 segundos sem scroll, considerar que parou de navegar
      const timeout = setTimeout(() => {
        setIsUserScrolling(false);
      }, 3000);
      
      setScrollTimeout(timeout);
    } else {
      // Se voltou ao final, pode fazer auto-scroll novamente
      setIsUserScrolling(false);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
        setScrollTimeout(null);
      }
    }
  };

  container.addEventListener('scroll', handleScroll);
  return () => {
    container.removeEventListener('scroll', handleScroll);
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
  };
}, [scrollTimeout]);

// Auto-scroll inteligente - só funciona se usuário não estiver navegando
useEffect(() => {
  if (isStreaming && !isUserScrolling && isAtBottom && messagesEndRef.current) {
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }
}, [filteredMessages, isStreaming, isUserScrolling, isAtBottom]);

// Scroll inicial quando nova conversa começa
useEffect(() => {
  if (filteredMessages.length === 1 && !isUserScrolling) {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }, 100);
  }
}, [filteredMessages.length]);
 
  
  const fetchGabiUser = async () => {
    try {
      const response = await api.get('/usuarios');
      const gabi = response.find((user: any) => user.cpf === '00000336366');
      if (gabi) {
        setGabiUser(gabi);
        console.log('Dados da Gabi carregados:', gabi);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da Gabi:', error);
    }
  };
  
  // CORREÇÃO 2: Função melhorada para carregar arquivos RAG com cache de IDs
  const [fileIdCache, setFileIdCache] = useState<Map<string, RAGFile>>(new Map());
  
  const fetchUserFiles = async () => {
    try {
      console.log('🔍 Buscando arquivos com RAG habilitado...');
      
      const response = await api.get('/files');
      console.log('📁 Resposta completa da API:', response);
      
      if (!response || (!response.folders && !response.files)) {
        console.error('❌ Resposta da API inválida:', response);
        setUserFiles([]);
        setFileIdCache(new Map());
        return;
      }
      
      const allItems: RAGFile[] = [];
      const newFileIdCache = new Map<string, RAGFile>();
      
      // Processar pastas
      if (response.folders && Array.isArray(response.folders)) {
        console.log(`📂 Processando ${response.folders.length} pastas...`);
        response.folders.forEach((folder: any) => {
          const hasRAG = folder.allowRAG === true;
          console.log(`📂 Pasta: ${folder.name} - RAG: ${hasRAG} (${folder.allowRAG})`);
          
          if (hasRAG) {
            const ragFile: RAGFile = {
              id: folder._id,
              name: folder.name,
              description: folder.description,
              type: 'folder',
              allowRAG: true
            };
            allItems.push(ragFile);
            newFileIdCache.set(folder._id, ragFile);
          }
        });
      }
      
      // Processar arquivos
      if (response.files && Array.isArray(response.files)) {
        console.log(`📄 Processando ${response.files.length} arquivos...`);
        response.files.forEach((file: any) => {
          const hasRAG = file.allowRAG === true;
          console.log(`📄 Arquivo: ${file.name} - RAG: ${hasRAG} (${file.allowRAG}) - Tipo: ${file.type}`);
          
          if (hasRAG) {
            const ragFile: RAGFile = {
              id: file._id,
              name: file.name,
              description: file.description,
              type: file.type || 'file',
              size: file.size ? formatFileSize(file.size) : undefined,
              allowRAG: true,
              allowDownload: file.allowDownload !== false,
              linkUrl: file.linkUrl,
              mimeType: file.mimeType,
              extension: file.extension
            };
            allItems.push(ragFile);
            newFileIdCache.set(file._id, ragFile);
          }
        });
      }
      
      console.log(`✅ Total de itens com RAG: ${allItems.length}`);
      console.log('📋 Itens com RAG:', allItems.map(item => `${item.name} (${item.type}) - ID: ${item.id}`));
      
      setUserFiles(allItems);
      setFileIdCache(newFileIdCache);
      
    } catch (error) {
      console.error("❌ Erro ao carregar arquivos:", error);
      setUserFiles([]);
      setFileIdCache(new Map());
      toast({
        title: "Erro",
        description: "Não foi possível carregar os arquivos disponíveis para IA.",
        variant: "destructive"
      });
    }
  };
  
  // Função auxiliar para formatar tamanho
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Verificar status do LLM
  const checkLLMStatus = async () => {
    setIsStatusChecking(true);
    try {
      const status = await llmService.checkStatus();
      setLlmStatus(status);
      
      if (status.status === 'offline') {
        toast({
          title: "Serviço LLM Indisponível",
          description: status.message || "O serviço de IA está temporariamente indisponível.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao verificar status do LLM:", error);
      setLlmStatus({
        status: 'offline',
        message: "Não foi possível verificar o status do serviço LLM."
      });
    } finally {
      setIsStatusChecking(false);
    }
  };
  
  // Enviar mensagem para o LLM
  const handleSendMessage = async () => {
    if (!messageInput.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: messageInput,
      timestamp: new Date()
    };
    
    const streamingMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      sender: "assistant",
      text: "",
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, userMessage, streamingMessage]);
    setMessageInput("");
    setIsLoading(true);
    setIsStreaming(true);
    
    try {
      if (llmStatus?.status !== 'online') {
        const status = await llmService.checkStatus();
        setLlmStatus(status);
        
        if (status.status !== 'online') {
          throw new Error("O serviço LLM não está disponível no momento.");
        }
      }
      
      const historyForLLM = messages.filter(msg => !msg.isLoading && !msg.isStreaming);
      const response = await llmService.sendMessage(
        userMessage.text, 
        [...historyForLLM, userMessage],
        (updatedText) => {
          setMessages(prev => prev.map(msg => 
            msg.isStreaming ? { ...msg, text: updatedText } : msg
          ));
        }
      );
      
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        
        const finalMessages = withoutLoading.map(msg => {
          if (msg.isStreaming) {
            return {
              ...msg,
              text: response.message,
              isStreaming: false,
              sources: response.sources
            };
          }
          return msg;
        });
        
        return finalMessages;
      });
      
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      
      setMessages(prev => {
        const withoutStreamingOrLoading = prev.filter(msg => !msg.isLoading && !msg.isStreaming);
        
        const errorMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          sender: "system",
          text: `Desculpe, ocorreu um erro: ${error instanceof Error ? error.message : "Falha ao processar mensagem"}`,
          timestamp: new Date()
        };
        
        return [...withoutStreamingOrLoading, errorMessage];
      });
      
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao processar mensagem",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };
  
  // CORREÇÃO 2: Função melhorada para exibir detalhes da fonte
  const showSourceInfo = (sourceId: string) => {
    console.log('🔍 Tentando mostrar fonte:', sourceId);
    console.log('📂 Cache de arquivos RAG:', Array.from(fileIdCache.keys()));
    console.log('📂 Arquivos RAG disponíveis:', userFiles.map(f => ({ id: f.id, name: f.name, type: f.type })));
    
    // CORREÇÃO 2: Buscar primeiro no cache, depois na lista atual
    let sourceFile = fileIdCache.get(sourceId);
    
    if (!sourceFile) {
      // Fallback: buscar na lista atual
      sourceFile = userFiles.find(file => file.id === sourceId);
    }
    
    if (!sourceFile) {
      console.error('❌ Arquivo fonte não encontrado:', sourceId);
      
      // CORREÇÃO 2: Tentar recarregar os arquivos antes de mostrar erro
      console.log('🔄 Tentando recarregar arquivos para encontrar a fonte...');
      fetchUserFiles().then(() => {
        // Tentar novamente após recarregar
        const reloadedFile = fileIdCache.get(sourceId) || userFiles.find(file => file.id === sourceId);
        if (reloadedFile) {
          console.log('✅ Arquivo fonte encontrado após reload:', reloadedFile);
          setSelectedSource(sourceId);
          setShowSourceDetails(true);
        } else {
          toast({
            title: "Arquivo não encontrado",
            description: `O arquivo fonte (ID: ${sourceId}) não foi encontrado na lista de arquivos disponíveis para IA. Pode ter sido removido ou você não tem mais acesso.`,
            variant: "destructive"
          });
        }
      });
      return;
    }
    
    console.log('✅ Arquivo fonte encontrado:', sourceFile);
    setSelectedSource(sourceId);
    setShowSourceDetails(true);
  };
  
  // Função formatMessage
  const formatMessage = (message: ChatMessage) => {
    if (message.isLoading) {
      return (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{message.text}</span>
        </div>
      );
    }
    
    if (message.sender === "assistant") {
      return (
        <div className="markdown-content">
          <ReactMarkdown>
            {message.text}
          </ReactMarkdown>
          
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-current animate-cursor-blink ml-0.5"></span>
          )}
          
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-1">Fontes utilizadas:</p>
              <div className="flex flex-wrap gap-1">
                {message.sources.map(source => (
                  <Badge 
                    key={source.id} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => showSourceInfo(source.id)}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    {source.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return message.text;
  };

  // Componente Sidebar para Desktop e Mobile
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Cabeçalho da Sidebar */}
      <div className="p-3 lg:p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Chat com Gabi</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearChat}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {isMobile ? "" : "Limpar"}
          </Button>
        </div>
      </div>
      
      {/* Status do LLM */}
      <div className="px-3 lg:px-4 py-3 border-b">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Status do Serviço:</p>
            <Badge variant={llmStatus?.status === 'online' ? "default" : "destructive"}>
              {llmStatus?.status === 'online' ? 'Online' : 'Offline'}
            </Badge>
          </div>
          
          {llmStatus?.status === 'online' && llmStatus.model && (
            <div className="text-xs text-gray-500">
              Modelo: {llmStatus.model}
            </div>
          )}
        </div>
        
        {/* Arquivos disponíveis para IA */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">Arquivos para IA</h3>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-xs">
                {userFiles.length}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchUserFiles}
                title="Recarregar arquivos"
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="max-h-32 lg:max-h-48 overflow-y-auto border rounded-md p-2">
            {userFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center text-gray-500">
                <Bot className="h-6 w-6 mb-2 text-gray-400" />
                <p className="text-xs">Nenhum arquivo habilitado para IA</p>
                <p className="text-xs mt-1 text-gray-400">
                  Ative a flag "RAG" nos seus arquivos
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {userFiles.slice(0, isMobile ? 3 : 5).map(file => (
                  <div 
                    key={file.id}
                    className="flex items-center p-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                    title={`${file.name} (${file.type}) - ID: ${file.id}`}
                  >
                    <Bot className="h-3 w-3 mr-2 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="ml-auto text-gray-400">({file.type})</span>
                  </div>
                ))}
                {userFiles.length > (isMobile ? 3 : 5) && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{userFiles.length - (isMobile ? 3 : 5)} itens
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Instruções */}
      <div className="px-3 lg:px-4 py-3 flex-1">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <FileQuestion className="h-4 w-4 mr-1" />
            Como usar:
          </h3>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4">
            <li>Faça perguntas sobre documentos</li>
            <li>Gabi usa apenas arquivos com IA habilitada</li>
            <li>Verifique as fontes das respostas</li>
            <li>Use "Limpar" para nova conversa</li>
          </ul>
          
          {userFiles.length === 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                💡 <strong>Dica:</strong> Ative a flag "Permitir uso no sistema de IA" 
                nos seus arquivos para que a Gabi possa utilizá-los.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  return (
    <Layout>
      <div className={cn(
        "h-[calc(100vh-9rem)]",
        isMobile && "h-[calc(100vh-4rem)]"
      )}>
        <Card className="h-full flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
            {/* Sidebar Desktop */}
            <div className="hidden lg:flex lg:col-span-1 border-r flex-col">
              <SidebarContent />
            </div>
            
            {/* Chat Area */}
            <div className="col-span-1 lg:col-span-2 flex flex-col h-full">
              {/* Header Mobile */}
              <div className="lg:hidden flex items-center justify-between p-3 border-b bg-white">
                <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0">
                    <div className="flex items-center justify-between p-3 border-b">
                      <h2 className="font-semibold">Chat</h2>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setIsMobileSidebarOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <SidebarContent />
                  </SheetContent>
                </Sheet>
                
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getGabiAvatar()} alt="Gabi" />
                    <AvatarFallback className="bg-gradient-to-br from-[#e60909] to-[#ff4444] text-white text-sm font-bold">
                      GB
                    </AvatarFallback>
                  </Avatar>
                  <h1 className="font-semibold text-sm">Chat com Gabi</h1>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleClearChat}
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </div>

              {/* Chat Messages - VERSÃO CORRIGIDA PARA SCROLL LIVRE */}
<div className="chat-messages-container">
  <div className="chat-messages-content">
    {filteredMessages.filter(msg => msg.sender === "user").length === 0 ? (
      <div className="flex items-center justify-center flex-1 flex-col px-4">
        <div className="relative mb-6">
          <div className="flex justify-center">
            <img 
              src={getGabiAvatar2()} 
              alt="Gabi - Assistente Virtual"
              className={cn(
                "object-contain rounded-lg shadow-lg",
                isMobile ? "h-72 w-auto max-w-[350px]" : "h-[28rem] w-auto max-w-[500px]"
              )}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 lg:w-6 lg:h-6 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <h3 className={cn(
          "font-medium text-center",
          isMobile ? "text-lg" : "text-xl"
        )}>
          Olá! Eu sou a Gabi
        </h3>
        {searchQuery ? (
          <p className="text-gray-500 mt-2 text-center text-sm">
            Nenhuma mensagem encontrada para "<span className="font-medium">{searchQuery}</span>"
          </p>
        ) : (
          <p className={cn(
            "text-gray-500 mt-2 text-center max-w-md",
            isMobile ? "text-sm px-4" : "text-base"
          )}>
            Sua assistente virtual da Intranet Super Nosso. 
            Como posso ajudar você hoje?
          </p>
        )}
      </div>
    ) : (
      <>
        {filteredMessages.map((message) => (
          <div 
            key={message.id}
            className={cn(
              "flex flex-col",
              isMobile ? "max-w-[90%]" : "max-w-[85%] lg:max-w-[80%]",
              message.sender === "user" 
                ? "ml-auto items-end" 
                : message.sender === "system"
                  ? "mx-auto items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg max-w-full"
                  : "mr-auto items-start"
            )}
          >
            {/* Cabeçalho da mensagem */}
            <div className="flex items-center mb-1 gap-2">
              {message.sender === "user" ? (
                <>
                  <div className="text-xs text-gray-500 mr-2">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="font-medium text-sm">Você</div>
                  <Avatar className={cn(isMobile ? "h-7 w-7" : "h-8 w-8")}>
                    <AvatarFallback className="bg-blue-100 text-blue-900 text-xs">
                      {user?.name?.substring(0, 2).toUpperCase() || "VC"}
                    </AvatarFallback>
                  </Avatar>
                </>
              ) : message.sender === "assistant" ? (
                <>
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={getGabiAvatar()} alt="Gabi" />
                    <AvatarFallback className="bg-supernosso-red text-white text-xs">
                      GB
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-medium text-sm">Gabi</div>
                  <div className="text-xs text-gray-500 ml-2">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </>
              ) : (
                <>
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={getGabiAvatar()} alt="Gabi" />
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                      SN
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-medium text-sm"></div>
                </>
              )}
            </div>
            
            {/* Conteúdo da mensagem */}
            <div 
              className={cn(
                "rounded-lg py-2 px-3",
                isMobile ? "text-sm" : "text-base",
                message.sender === "user"
                  ? "bg-blue-100 text-gray-900 dark:bg-blue-800 dark:text-gray-50"
                  : message.sender === "system"
                    ? "bg-transparent" 
                    : "bg-white border text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              )}
            >
              {formatMessage(message)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </>
    )}
  </div>
</div>

              
              {/* Message Input */}
              <div className={cn(
                "border-t p-3 flex gap-2",
                isMobile && "bg-white sticky bottom-0"
              )}>
                                
                <Input 
                  placeholder="Digite uma mensagem..." 
                  className={cn(
                    "focus-visible:ring-supernosso-red",
                    isMobile ? "text-sm h-8" : "h-10"
                  )}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading || llmStatus?.status !== 'online'}
				    autoComplete="off"
					  autoCorrect="off"
					  autoCapitalize="off"
					  spellCheck="false"
					  inputMode="text"
                />
                
                <Button 
                  className={cn(
                    "bg-supernosso-red hover:bg-supernosso-red/90 flex-shrink-0",
                    isMobile ? "h-8 w-8 p-0" : "h-10 w-10 p-0"
                  )}
                  onClick={handleSendMessage}
                  disabled={isLoading || !messageInput.trim() || llmStatus?.status !== 'online'}
                >
                  {isLoading ? (
                    <Loader2 className={cn(
                      "animate-spin",
                      isMobile ? "h-3 w-3" : "h-4 w-4"
                    )} />
                  ) : (
                    <Send className={cn(
                      isMobile ? "h-3 w-3" : "h-4 w-4"
                    )} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* CORREÇÃO 2: Diálogo melhorado para exibir detalhes da fonte */}
      <Dialog open={showSourceDetails} onOpenChange={setShowSourceDetails}>
        <DialogContent className={cn(
          isMobile ? "max-w-[95vw] max-h-[90vh]" : "max-w-md"
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-supernosso-red" />
              Detalhes da Fonte
            </DialogTitle>
          </DialogHeader>
          
          {selectedSource && (
            <div className="mt-4 space-y-4">
              {(() => {
                console.log('🔍 Buscando fonte no diálogo:', selectedSource);
                console.log('📂 Cache de arquivos RAG no diálogo:', Array.from(fileIdCache.keys()));
                console.log('📂 Arquivos RAG no diálogo:', userFiles.map(f => ({ id: f.id, name: f.name })));
                
                // CORREÇÃO 2: Buscar primeiro no cache, depois na lista atual
                let sourceFile = fileIdCache.get(selectedSource);
                
                if (!sourceFile) {
                  sourceFile = userFiles.find(file => file.id === selectedSource);
                }
                
                if (!sourceFile) {
                  console.error('❌ Arquivo fonte não encontrado no diálogo:', selectedSource);
                  return (
                    <div className="flex items-center justify-center py-8 text-center text-gray-500">
                      <div className="text-center">
                        <AlertCircle className="h-10 w-10 mb-2 mx-auto text-red-400" />
                        <p className="font-medium">Arquivo não encontrado</p>
                        <p className="text-sm mt-1">
                          Este arquivo pode ter sido excluído, movido ou você não tem mais acesso a ele
                        </p>
                        <p className="text-xs mt-2 text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                          ID: {selectedSource}
                        </p>
                        <div className="mt-4 space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              console.log('🔄 Recarregando arquivos RAG...');
                              fetchUserFiles();
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Recarregar arquivos
                          </Button>
                          <div className="text-xs text-gray-500">
                            Total de arquivos RAG ativos: {userFiles.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                console.log('✅ Arquivo fonte encontrado no diálogo:', sourceFile);
                
                return (
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="h-10 w-10 mr-3 text-supernosso-red flex items-center justify-center">
                        {sourceFile.type === 'link' ? (
                          <ExternalLink className="h-8 w-8" />
                        ) : sourceFile.type === 'folder' ? (
                          <Database className="h-8 w-8" />
                        ) : (
                          <FileText className="h-8 w-8" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium break-words">
                          {sourceFile.name}
                        </h3>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Tipo: {sourceFile.type === 'folder' ? 'Pasta' : sourceFile.type === 'link' ? 'Link' : 'Arquivo'}</p>
                          {sourceFile.size && <p>Tamanho: {sourceFile.size}</p>}
                          {sourceFile.extension && <p>Extensão: {sourceFile.extension}</p>}
                          <div className="flex items-center gap-2">
                            <Bot className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-blue-600">Habilitado para IA</span>
                          </div>
                          <p className="text-xs text-gray-400 font-mono bg-gray-100 px-1 rounded">
                            ID: {sourceFile.id}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {sourceFile.description && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-1">Descrição:</h4>
                        <p className="text-sm text-gray-600">{sourceFile.description}</p>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => setShowSourceDetails(false)}
                      >
                        Fechar
                      </Button>
                      
                      {sourceFile.type === 'link' && sourceFile.linkUrl ? (
                        <Button
                          className="w-full sm:w-auto bg-supernosso-red hover:bg-supernosso-red/90"
                          onClick={() => {
                            window.open(sourceFile.linkUrl, '_blank', 'noopener,noreferrer');
                            setShowSourceDetails(false);
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir Link
                        </Button>
                      ) : sourceFile.allowDownload ? (
                        <Button
                          className="w-full sm:w-auto bg-supernosso-red hover:bg-supernosso-red/90"
                          onClick={async () => {
                            try {
                              // Download direto via API
                              const token = localStorage.getItem('token');
                              const baseUrl = process.env.NODE_ENV === 'production' 
                                ? '/api' 
                                : 'http://localhost:3000/api';
                              
                              const response = await fetch(`${baseUrl}/files/download/${selectedSource}`, {
                                method: 'GET',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'x-auth-token': token || ''
                                }
                              });
                              
                              if (!response.ok) {
                                throw new Error('Erro ao baixar arquivo');
                              }
                              
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = sourceFile.name;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                              
                              setShowSourceDetails(false);
                              
                              toast({
                                title: "Download iniciado",
                                description: `Arquivo "${sourceFile.name}" está sendo baixado.`
                              });
                            } catch (error) {
                              console.error('Erro no download:', error);
                              toast({
                                title: "Erro",
                                description: "Não foi possível baixar o arquivo.",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Arquivo
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          disabled
                        >
                          Download não permitido
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Chat;