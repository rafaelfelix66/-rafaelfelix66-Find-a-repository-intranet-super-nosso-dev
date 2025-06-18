// src/pages/Chat.tsx - VERSÃO RECRIADA SIMPLIFICADA
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
  Send, 
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

// Interface para arquivos RAG
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
  folderPath?: string;
}

const Chat = () => {
  // Hooks
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Estados
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [llmStatus, setLlmStatus] = useState<LLMStatus | null>(null);
  const [userFiles, setUserFiles] = useState<RAGFile[]>([]);
  const [gabiUser, setGabiUser] = useState<any>(null);
  const [fileIdCache, setFileIdCache] = useState<Map<string, RAGFile>>(new Map());
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Função para scroll automático
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Avatar da Gabi
  const getGabiAvatar = () => {
    if (gabiUser?.avatar) return gabiUser.avatar;
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNmM2Y0ZjYiLz48cGF0aCBkPSJNMjAgMjVjMC04IDEwLTE1IDMwLTE1czMwIDcgMzAgMTVjMCA4LTEwIDE1LTMwIDE1cy0zMC03LTMwLTE1eiIgZmlsbD0iIzNlMmIxOSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDUiIHI9IjIwIiBmaWxsPSIjZjJjNjc0Ii8+PGVsbGlwc2UgY3g9IjQzIiBjeT0iNDIiIHJ4PSI0IiByeT0iNiIgZmlsbD0iIzJkM2E0ZiIvPjxlbGxpcHNlIGN4PSI1NyIgY3k9IjQyIiByeD0iNCIgcnk9IjYiIGZpbGw9IiMyZDNhNGYiLz48ZWxsaXBzZSBjeD0iNTAiIGN5PSI0OCIgcng9IjIiIHJ5PSIxIiBmaWxsPSIjZjJjNjc0Ii8+PHBhdGggZD0iTTQ1IDUyYzMgMyA3IDMgMTAgMGMtMyAzLTcgMy0xMCAwIiBzdHJva2U9IiNkNjM0NGYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTMwIDY1YzUgLTUgMTUtNSAyMCAwczE1IDUgMjAgMGwwIDE1bC00MCAway0wIC0xNXoiIGZpbGw9IiNmZmQ3MDAiLz48L3N2Zz4=";
  };

  const getGabiAvatar2 = () => "/Gabi.png";

  // Função para formatar tamanho de arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Limpar chat
  const handleClearChat = () => {
    setMessages([
      {
        id: "system-1",
        sender: "system",
        text: "Olá! Eu sou a Gabi, sua assistente virtual da Intranet Super Nosso. Estou integrada com o sistema RAG e posso responder perguntas sobre os documentos da sua biblioteca de arquivos. Em que posso ajudar você hoje?",
        timestamp: new Date()
      }
    ]);
    setMessageInput("");
  };

  // Buscar dados da Gabi
  const fetchGabiUser = async () => {
    try {
      const response = await api.get('/usuarios');
      const gabi = response.find((user: any) => user.cpf === '00000336366');
      if (gabi) setGabiUser(gabi);
    } catch (error) {
      console.error('Erro ao buscar dados da Gabi:', error);
    }
  };

  // Buscar arquivos RAG
  const fetchUserFiles = async () => {
    try {
      const response = await api.get('/files');
      
      if (!response || (!response.folders && !response.files)) {
        setUserFiles([]);
        setFileIdCache(new Map());
        return;
      }
      
      const allItems: RAGFile[] = [];
      const newFileIdCache = new Map<string, RAGFile>();
      
      // Processar pastas
      if (response.folders && Array.isArray(response.folders)) {
        response.folders.forEach((folder: any) => {
          if (folder.allowRAG === true) {
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
        response.files.forEach((file: any) => {
          if (file.allowRAG === true) {
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
      
      setUserFiles(allItems);
      setFileIdCache(newFileIdCache);
      
    } catch (error) {
      console.error("Erro ao carregar arquivos:", error);
      setUserFiles([]);
      setFileIdCache(new Map());
      toast({
        title: "Erro",
        description: "Não foi possível carregar os arquivos disponíveis para IA.",
        variant: "destructive"
      });
    }
  };

  // Verificar status do LLM
  const checkLLMStatus = async () => {
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
        return prev.map(msg => {
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
    }
  };

  // Mostrar detalhes da fonte
  const showSourceInfo = (sourceId: string) => {
    let sourceFile = fileIdCache.get(sourceId);
    
    if (!sourceFile) {
      sourceFile = userFiles.find(file => file.id === sourceId);
    }
    
    if (!sourceFile) {
      fetchUserFiles().then(() => {
        const reloadedFile = fileIdCache.get(sourceId) || userFiles.find(file => file.id === sourceId);
        if (reloadedFile) {
          setSelectedSource(sourceId);
          setShowSourceDetails(true);
        } else {
          toast({
            title: "Arquivo não encontrado",
            description: `O arquivo fonte não foi encontrado.`,
            variant: "destructive"
          });
        }
      });
      return;
    }
    
    setSelectedSource(sourceId);
    setShowSourceDetails(true);
  };

  // Formatar mensagem
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
          <ReactMarkdown>{message.text}</ReactMarkdown>
          
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-current animate-cursor-blink ml-0.5"></span>
          )}
          
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Fontes utilizadas:</p>
              <div className="flex flex-wrap gap-1">
                {message.sources.map(source => (
                  <Badge 
                    key={source.id} 
                    variant="outline" 
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

  // Componente Sidebar
  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Chat com Gabi</h2>
          <Button variant="outline" size="sm" onClick={handleClearChat}>
            <RefreshCw className="h-4 w-4" />
            {!isMobile && <span className="ml-2">Limpar</span>}
          </Button>
        </div>
      </div>
      
      {/* Status */}
      <div className="p-4 border-b">
        <div className="bg-gray-50 rounded-md p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Status:</p>
            <Badge variant={llmStatus?.status === 'online' ? "default" : "destructive"}>
              {llmStatus?.status === 'online' ? 'Online' : 'Offline'}
            </Badge>
          </div>
          {llmStatus?.status === 'online' && llmStatus.model && (
            <div className="text-xs text-gray-500">Modelo: {llmStatus.model}</div>
          )}
        </div>
        
        {/* Arquivos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">Arquivos para IA</h3>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-xs">{userFiles.length}</Badge>
              <Button variant="ghost" size="sm" onClick={fetchUserFiles} className="h-6 w-6 p-0">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto border rounded-md p-2">
            {userFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center text-gray-500">
                <Bot className="h-6 w-6 mb-2 text-gray-400" />
                <p className="text-xs">Nenhum arquivo habilitado para IA</p>
              </div>
            ) : (
              <div className="space-y-1">
                {userFiles.slice(0, 5).map(file => (
                  <div key={file.id} className="flex items-center p-2 text-xs hover:bg-gray-50 rounded-md">
                    <Bot className="h-3 w-3 mr-2 text-blue-500" />
                    <span className="truncate">{file.name}</span>
                    <span className="ml-auto text-gray-400">({file.type})</span>
                  </div>
                ))}
                {userFiles.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">+{userFiles.length - 5} itens</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Instruções */}
      <div className="p-4 flex-1">
        <div className="bg-gray-50 rounded-md p-3">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <FileQuestion className="h-4 w-4 mr-1" />
            Como usar:
          </h3>
          <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
            <li>Faça perguntas sobre documentos</li>
            <li>Gabi usa apenas arquivos com IA habilitada</li>
            <li>Verifique as fontes das respostas</li>
            <li>Use "Limpar" para nova conversa</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Effects
  useEffect(() => {
    checkLLMStatus();
    fetchGabiUser();
    handleClearChat();
    fetchUserFiles();
  }, []);

  // Auto-scroll quando mensagens mudam
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Layout>
      <div className={cn("h-[calc(100vh-9rem)]", isMobile && "h-[calc(100vh-4rem)]")}>
        <Card className="h-full flex flex-col">
          <div className="flex h-full">
            {/* Sidebar Desktop */}
            {!isMobile && (
              <div className="w-80 border-r">
                <SidebarContent />
              </div>
            )}
            
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Mobile Header */}
              {isMobile && (
                <div className="flex items-center justify-between p-3 border-b bg-white">
                  <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 p-0">
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
                  
                  <Button variant="ghost" size="sm" onClick={handleClearChat}>
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 1 ? (
                    // Welcome Screen
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center max-w-md">
                        <div className="relative mb-6">
                          <img 
                            src={getGabiAvatar2()} 
                            alt="Gabi"
                            className={cn(
                              "mx-auto rounded-lg shadow-lg",
                              isMobile ? "h-72 w-auto max-w-[350px]" : "h-[28rem] w-auto max-w-[500px]"
                            )}
                          />
                          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <h3 className="text-xl font-medium mb-2">Olá! Eu sou a Gabi</h3>
                        <p className="text-gray-500 text-sm">
                          Sua assistente virtual da Intranet Super Nosso. Como posso ajudar você hoje?
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Messages
                    messages.map((message) => (
                      <div 
                        key={message.id}
                        className={cn(
                          "flex",
                          message.sender === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[80%] flex gap-3",
                          message.sender === "user" ? "flex-row-reverse" : "flex-row"
                        )}>
                          {/* Avatar */}
                          <Avatar className={cn(message.sender === "user" ? "h-10 w-10" : "h-12 w-12")}>
                            {message.sender === "user" ? (
                              <AvatarFallback className="bg-blue-100 text-blue-900 text-xs">
                                {user?.name?.substring(0, 2).toUpperCase() || "VC"}
                              </AvatarFallback>
                            ) : (
                              <>
                                <AvatarImage src={getGabiAvatar()} alt="Gabi" />
                                <AvatarFallback className="bg-gradient-to-br from-[#e60909] to-[#ff4444] text-white text-xs">
                                  GB
                                </AvatarFallback>
                              </>
                            )}
                          </Avatar>
                          
                          {/* Message Content */}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {message.sender === "user" ? "Você" : "Gabi"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            
                            <div className={cn(
                              "rounded-lg p-3 text-sm",
                              message.sender === "user" 
                                ? "bg-blue-100 text-gray-900" 
                                : "bg-white border text-gray-900"
                            )}>
                              {formatMessage(message)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Digite uma mensagem..." 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isLoading || llmStatus?.status !== 'online'}
                    className="flex-1"
                  />
                  
                  <Button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !messageInput.trim() || llmStatus?.status !== 'online'}
                    size="icon"
                    className="bg-supernosso-red hover:bg-supernosso-red/90"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Dialog para detalhes da fonte */}
      <Dialog open={showSourceDetails} onOpenChange={setShowSourceDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-supernosso-red" />
              Detalhes da Fonte
            </DialogTitle>
          </DialogHeader>
          
          {selectedSource && (() => {
            let sourceFile = fileIdCache.get(selectedSource) || userFiles.find(file => file.id === selectedSource);
            
            if (!sourceFile) {
              return (
                <div className="text-center py-8">
                  <AlertCircle className="h-10 w-10 mb-2 mx-auto text-red-400" />
                  <p className="font-medium">Arquivo não encontrado</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Este arquivo pode ter sido excluído ou movido.
                  </p>
                </div>
              );
            }
            
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 text-supernosso-red flex items-center justify-center">
                    {sourceFile.type === 'link' ? (
                      <ExternalLink className="h-8 w-8" />
                    ) : sourceFile.type === 'folder' ? (
                      <Database className="h-8 w-8" />
                    ) : (
                      <FileText className="h-8 w-8" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{sourceFile.name}</h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Tipo: {sourceFile.type === 'folder' ? 'Pasta' : sourceFile.type === 'link' ? 'Link' : 'Arquivo'}</p>
                      {sourceFile.size && <p>Tamanho: {sourceFile.size}</p>}
                      <div className="flex items-center gap-1">
                        <Bot className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-blue-600">Habilitado para IA</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {sourceFile.description && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Descrição:</h4>
                    <p className="text-sm text-gray-600">{sourceFile.description}</p>
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSourceDetails(false)}>
                    Fechar
                  </Button>
                  
                  {sourceFile.type === 'link' && sourceFile.linkUrl ? (
                    <Button
                      className="bg-supernosso-red hover:bg-supernosso-red/90"
                      onClick={() => {
                        window.open(sourceFile.linkUrl, '_blank');
                        setShowSourceDetails(false);
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Link
                    </Button>
                  ) : sourceFile.allowDownload ? (
                    <Button
                      className="bg-supernosso-red hover:bg-supernosso-red/90"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          const baseUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api';
                          
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
                    <Button variant="outline" disabled>
                      Download não permitido
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Chat;