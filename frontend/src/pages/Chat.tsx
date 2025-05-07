// src/pages/Chat.tsx
import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
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
  Paperclip, 
  FileText,
  MessageCircle, 
  AlertCircle, 
  Loader2,
  FileQuestion,
  Database
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
import { fileService } from "@/services/fileService";
import { FileItem } from "@/contexts/FileContext";
import { ConversationList } from '@/components/chat/ConversationList';
import { conversationService, Conversation } from '@/services/conversationService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Chat = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [llmStatus, setLlmStatus] = useState<LLMStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);
  const [isStatusChecking, setIsStatusChecking] = useState(false);
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [userFiles, setUserFiles] = useState<FileItem[]>([]);
  
  // Novo estado para controlar streaming
  const [isStreaming, setIsStreaming] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Estados para gerenciamento de conversas
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationSearchQuery, setConversationSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  
  // Atualizar conversas filtradas quando o termo de busca mudar
  useEffect(() => {
    if (!conversationSearchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }
    
    const filtered = conversations.filter(conv => 
      conv.title.toLowerCase().includes(conversationSearchQuery.toLowerCase())
    );
    
    setFilteredConversations(filtered);
  }, [conversationSearchQuery, conversations]);

  // Criar nova conversa
  const handleNewConversation = () => {
    // Título padrão com data
    const today = format(new Date(), "dd 'de' MMMM', às' HH:mm", { locale: ptBR });
    const title = `Conversa em ${today}`;
    
    // Criar conversa com mensagem inicial do sistema
    const systemMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      sender: "system",
      text: "Bem-vindo à nova conversa. Como posso ajudar?",
      timestamp: new Date()
    };
    
    const newConversation = conversationService.createConversation(title, [systemMessage]);
    
    // Atualizar estados
    setConversations([newConversation, ...conversations]);
    setActiveConversationId(newConversation.id);
    setMessages([systemMessage]);
    setMessageInput("");
  };

  // Selecionar conversa existente
  const handleSelectConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    setActiveConversationId(conversationId);
    setMessages(conversation.messages);
  };

  // Excluir conversa
  const handleDeleteConversation = (conversationId: string) => {
    // Perguntar para confirmar
    if (!window.confirm("Tem certeza que deseja excluir esta conversa?")) {
      return;
    }
    
    const deleted = conversationService.deleteConversation(conversationId);
    
    if (deleted) {
      const updatedConversations = conversations.filter(c => c.id !== conversationId);
      setConversations(updatedConversations);
      
      // Se a conversa ativa foi excluída, limpar mensagens
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    }
  };

  // Salvar mensagem na conversa ativa
  const saveMessageToConversation = (message: ChatMessage) => {
    if (!activeConversationId) return;
    
    conversationService.addMessageToConversation(activeConversationId, message);
    
    // Atualizar lista de conversas
    const updatedConversations = conversationService.getAllConversations();
    setConversations(updatedConversations);
  };
  
  // Verificar status do LLM ao carregar o componente
  useEffect(() => {
    checkLLMStatus();
    
    // Adicionar mensagem inicial do sistema
    setMessages([
      {
        id: "system-1",
        sender: "system",
        text: "Bem-vindo ao Chat da Intranet Super Nosso, integrado com o sistema RAG. " +
              "Faça perguntas sobre documentos da sua biblioteca de arquivos e o assistente " +
              "responderá com base nesse conteúdo.",
        timestamp: new Date()
      }
    ]);
    
    // Carregar arquivos do usuário
    fetchUserFiles();
  }, []);
  
  // Carregar conversas salvas
  useEffect(() => {
    const savedConversations = conversationService.getAllConversations();
    setConversations(savedConversations);
    setFilteredConversations(savedConversations);
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
  
  // Rolar para a última mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages]);
  
  // Carregar arquivos do usuário
  const fetchUserFiles = async () => {
    try {
      const files = await fileService.getFiles();
      setUserFiles(files);
    } catch (error) {
      console.error("Erro ao carregar arquivos:", error);
    }
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
    
    // Adicionar mensagem do usuário
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: messageInput,
      timestamp: new Date()
    };
    
    // Gerenciar conversa atual
    if (activeConversationId) {
      // Adicionar à conversa existente
      saveMessageToConversation(userMessage);
    } else {
      // Criar nova conversa com esta mensagem
      const today = format(new Date(), "dd 'de' MMMM', às' HH:mm", { locale: ptBR });
      const title = `Conversa em ${today}`;
      
      const systemMessage: ChatMessage = {
        id: `system-${Date.now() - 1}`,
        sender: "system",
        text: "Bem-vindo à nova conversa. Como posso ajudar?",
        timestamp: new Date(Date.now() - 1000)
      };
      
      const newConversation = conversationService.createConversation(
        title, 
        [systemMessage, userMessage]
      );
      
      setConversations([newConversation, ...conversations]);
      setActiveConversationId(newConversation.id);
    }
    
	const streamingMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      sender: "assistant",
      text: "", // Texto inicial vazio
      timestamp: new Date(),
      isStreaming: true // Marcar como streaming
    };
	
    
    setMessages(prev => [...prev, userMessage, streamingMessage]);
    setMessageInput("");
    setIsLoading(true);
	setIsStreaming(true);
    
    try {
      // Verificar status do LLM antes de enviar
      if (llmStatus?.status !== 'online') {
        const status = await llmService.checkStatus();
        setLlmStatus(status);
        
        if (status.status !== 'online') {
          throw new Error("O serviço LLM não está disponível no momento.");
        }
      }
      
       // Enviar mensagem para o LLM com callback de streaming
      const historyForLLM = messages.filter(msg => !msg.isLoading && !msg.isStreaming);
      const response = await llmService.sendMessage(
        userMessage.text, 
        [...historyForLLM, userMessage],
        // Callback de progresso para atualizar mensagem em streaming
        (updatedText) => {
          setMessages(prev => prev.map(msg => 
            msg.isStreaming ? { ...msg, text: updatedText } : msg
          ));
        }
      );
      
      // Quando a resposta estiver completa, finalizar a mensagem de streaming
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        
        // Transformar a mensagem de streaming em mensagem final
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
		
		// Salvar mensagem final do assistente na conversa
        const assistantMessage = finalMessages.find(msg => 
          msg.id === `assistant-${Date.now()}`.split('-')[0]
        );
        
        if (assistantMessage && activeConversationId) {
          saveMessageToConversation(assistantMessage);
        }
        
        return finalMessages;
      });
      
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      
      // Remover mensagem de loading e adicionar mensagem de erro
      setMessages(prev => {
        const withoutStreamingOrLoading = prev.filter(msg => !msg.isLoading && !msg.isStreaming);
        
        const errorMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          sender: "system",
          text: `Erro: ${error instanceof Error ? error.message : "Falha ao processar mensagem"}`,
          timestamp: new Date()
        };
        
        // Salvar mensagem de erro na conversa
        if (activeConversationId) {
          saveMessageToConversation(errorMessage);
        }
        
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
  
  // Exibir detalhes de uma fonte
  const showSourceInfo = (sourceId: string) => {
    setSelectedSource(sourceId);
    setShowSourceDetails(true);
  };
  
  // Função formatMessage modificada para mostrar o cursor piscante
  const formatMessage = (message: ChatMessage) => {
    if (message.isLoading) {
      return (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{message.text}</span>
        </div>
      );
    }
    
    // Renderizar markdown para mensagens do assistente
    if (message.sender === "assistant") {
      return (
        <div className="markdown-content">
          <ReactMarkdown>
            {message.text}
          </ReactMarkdown>
          
           {/* Mostrar cursor piscante durante streaming */}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-current animate-cursor-blink ml-0.5"></span>
          )}
          
          {/* Exibir fontes utilizadas */}
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
    
    // Texto simples para outras mensagens
    return message.text;
  };
  
  return (
    <Layout>
      <div className="h-[calc(100vh-9rem)]">
        <Card className="h-full flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Sidebar - Conversas */}
            <div className="border-r md:col-span-1 flex flex-col">
              <ConversationList
                conversations={filteredConversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                onDeleteConversation={handleDeleteConversation}
                searchQuery={conversationSearchQuery}
                setSearchQuery={setConversationSearchQuery}
              />
              
              {/* Status do LLM */}
              <div className="px-4 py-3">
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
                
                {/* Arquivos disponíveis */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">Arquivos Disponíveis</h3>
                    <Badge variant="outline" className="text-xs">
                      {userFiles.length}
                    </Badge>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                    {userFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                        <Database className="h-10 w-10 mb-2 text-gray-400" />
                        <p className="text-sm">Nenhum arquivo disponível</p>
                        <p className="text-xs mt-1">
                          Adicione arquivos na página "Arquivos" para usar no RAG
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {userFiles.map(file => (
                          <div 
                            key={file.id}
                            className="flex items-center p-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                          >
                            <FileText className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Barra de busca */}
                <div className="relative mt-4">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Buscar nas mensagens..." 
                    className="pl-8 focus-visible:ring-supernosso-red"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Instruções */}
              <div className="px-4 py-3 mt-2">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <FileQuestion className="h-4 w-4 mr-1" />
                    Como usar:
                  </h3>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4">
                    <li>Faça perguntas sobre os documentos armazenados</li>
                    <li>O assistente buscará informações relevantes</li>
                    <li>Você pode verificar as fontes de cada resposta</li>
                    <li>As conversas são salvas automaticamente</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex-1"></div>
            </div>
            
            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col h-full">
              {/* Chat Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {filteredMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full flex-col">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
                      <MessageCircle className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium">Nenhuma mensagem encontrada</h3>
                    {searchQuery ? (
                      <p className="text-gray-500 mt-2">
                        Tente uma busca diferente
                      </p>
                    ) : (
                      <p className="text-gray-500 mt-2">
                        Comece uma conversa com o assistente
                      </p>
                    )}
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <div 
                      key={message.id}
                      className={cn(
                        "flex flex-col max-w-[80%]",
                        message.sender === "user" 
                          ? "ml-auto items-end" 
                          : message.sender === "system"
                            ? "mx-auto items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg max-w-full"
                            : "mr-auto items-start"
                      )}
                    >
                      {/* Cabeçalho da mensagem com avatar e info do remetente */}
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
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-blue-100 text-blue-900 text-xs">
                                {user?.name?.substring(0, 2).toUpperCase() || "VC"}
                              </AvatarFallback>
                            </Avatar>
                          </>
                        ) : message.sender === "assistant" ? (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-supernosso-red text-white text-xs">
                                AI
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium text-sm">Assistente</div>
                            <div className="text-xs text-gray-500 ml-2">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </>
                        ) : (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                SN
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium text-sm">Sistema</div>
                          </>
                        )}
                      </div>
                      
                      {/* Conteúdo da mensagem */}
                      <div 
                        className={cn(
                          "rounded-lg py-2 px-3",
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
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="border-t p-3 flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-500"
                        disabled={isLoading}
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Anexar arquivo (Em breve)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Input 
                  placeholder="Digite uma mensagem..." 
                  className="focus-visible:ring-supernosso-red"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading || llmStatus?.status !== 'online'}
                />
                
                <Button 
                  className="bg-supernosso-red hover:bg-supernosso-red/90" 
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={isLoading || !messageInput.trim() || llmStatus?.status !== 'online'}
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
        </Card>
      </div>
      
      {/* Diálogo para exibir detalhes da fonte */}
      <Dialog open={showSourceDetails} onOpenChange={setShowSourceDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Fonte</DialogTitle>
          </DialogHeader>
          
          {selectedSource && (
            <div className="mt-4 space-y-4">
              {userFiles.find(file => file.id === selectedSource) ? (
                <div>
                  <div className="flex items-center mb-4">
                    <FileText className="h-10 w-10 mr-3 text-supernosso-red" />
                    <div>
                      <h3 className="font-medium">
                        {userFiles.find(file => file.id === selectedSource)?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {userFiles.find(file => file.id === selectedSource)?.size || 'Tamanho desconhecido'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="outline"
                      className="mr-2"
                      onClick={() => setShowSourceDetails(false)}
                    >
                      Fechar
                    </Button>
                    <Button
                      onClick={() => {
                        fileService.downloadFile(selectedSource);
                        setShowSourceDetails(false);
                      }}
                    >
                      Baixar Arquivo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-center text-gray-500">
                  <div className="text-center">
                    <AlertCircle className="h-10 w-10 mb-2 mx-auto text-gray-400" />
                    <p>Arquivo não encontrado</p>
                    <p className="text-sm mt-1">
                      Este arquivo pode ter sido excluído ou movido
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Chat;