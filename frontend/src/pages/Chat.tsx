
import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Info, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  lastMessage?: string;
  lastMessageTime?: string;
  online: boolean;
}

interface ChatMessage {
  id: string;
  text: string;
  sent: boolean;
  timestamp: string;
  read: boolean;
}

interface ChatConversation {
  userId: string;
  messages: ChatMessage[];
}

const sampleUsers: ChatUser[] = [
  {
    id: "1",
    name: "Maria Silva",
    initials: "MS",
    lastMessage: "Você viu o novo relatório?",
    lastMessageTime: "10:25",
    online: true
  },
  {
    id: "2",
    name: "João Oliveira",
    initials: "JO",
    lastMessage: "Precisamos marcar uma reunião",
    lastMessageTime: "Ontem",
    online: false
  },
  {
    id: "3",
    name: "Ana Santos",
    initials: "AS",
    lastMessage: "Ok, vou verificar isso",
    lastMessageTime: "Seg",
    online: true
  },
  {
    id: "4",
    name: "Pedro Costa",
    initials: "PC",
    lastMessage: "Obrigado pela ajuda!",
    lastMessageTime: "Seg",
    online: false
  },
  {
    id: "5",
    name: "Carla Martins",
    initials: "CM",
    lastMessage: "Documento enviado para análise",
    lastMessageTime: "23/05",
    online: false
  }
];

const sampleConversations: Record<string, ChatConversation> = {
  "1": {
    userId: "1",
    messages: [
      {
        id: "1-1",
        text: "Olá, tudo bem?",
        sent: false,
        timestamp: "10:15",
        read: true
      },
      {
        id: "1-2",
        text: "Tudo ótimo, e você?",
        sent: true,
        timestamp: "10:17",
        read: true
      },
      {
        id: "1-3",
        text: "Estou bem também! Você viu o novo relatório?",
        sent: false,
        timestamp: "10:25",
        read: true
      }
    ]
  },
  "2": {
    userId: "2",
    messages: [
      {
        id: "2-1",
        text: "Bom dia!",
        sent: false,
        timestamp: "09:30",
        read: true
      },
      {
        id: "2-2",
        text: "Bom dia, João! Como posso ajudar?",
        sent: true,
        timestamp: "09:35",
        read: true
      },
      {
        id: "2-3",
        text: "Precisamos marcar uma reunião para discutir o projeto",
        sent: false,
        timestamp: "09:40",
        read: true
      }
    ]
  }
};

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [conversations, setConversations] = useState<Record<string, ChatConversation>>(sampleConversations);
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedUser, conversations]);
  
  const filteredUsers = sampleUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSendMessage = () => {
    if (!selectedUser || !messageInput.trim()) return;
    
    const newMessage: ChatMessage = {
      id: `${selectedUser.id}-${Date.now()}`,
      text: messageInput,
      sent: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    
    const currentConversation = conversations[selectedUser.id] || {
      userId: selectedUser.id,
      messages: []
    };
    
    setConversations({
      ...conversations,
      [selectedUser.id]: {
        ...currentConversation,
        messages: [...currentConversation.messages, newMessage]
      }
    });
    
    setMessageInput("");
    
    // Simulate reply after a delay
    if (Math.random() > 0.5) {
      setTimeout(() => {
        const replyMessage: ChatMessage = {
          id: `${selectedUser.id}-${Date.now() + 1}`,
          text: "Obrigado pela mensagem! Vou analisar e retorno em breve.",
          sent: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: true
        };
        
        setConversations(prev => ({
          ...prev,
          [selectedUser.id]: {
            ...prev[selectedUser.id],
            messages: [...prev[selectedUser.id].messages, replyMessage]
          }
        }));
      }, 2000);
    }
  };
  
  const formatMessageDate = (message: ChatMessage, index: number, messages: ChatMessage[]) => {
    // Check if this is the first message or if the previous message was on a different day
    if (index === 0) {
      return new Date().toLocaleDateString();
    }
    
    // In a real app, you would compare actual dates
    // For simplicity, we'll just show the date for the first message
    return null;
  };
  
  return (
    <Layout>
      <div className="h-[calc(100vh-9rem)]">
        <Card className="h-full flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Sidebar - User List */}
            <div className="border-r md:col-span-1 flex flex-col">
              <CardHeader className="pb-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Buscar contatos..." 
                    className="pl-8 focus-visible:ring-supernosso-red"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-auto p-0">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id}
                    className={cn(
                      "flex items-center p-3 gap-3 cursor-pointer transition-colors border-b",
                      selectedUser?.id === user.id 
                        ? "bg-supernosso-light-red"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-[#e60909] text-white">
                          {user.initials}
                        </AvatarFallback>
                      </Avatar>
                      {user.online && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium truncate">{user.name}</p>
                        {user.lastMessageTime && (
                          <span className="text-xs text-gray-500">{user.lastMessageTime}</span>
                        )}
                      </div>
                      {user.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {user.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum contato encontrado</p>
                  </div>
                )}
              </CardContent>
            </div>
            
            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col h-full">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="border-b p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedUser.avatar} />
                        <AvatarFallback className="bg-[#e60909] text-white">
                          {selectedUser.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedUser.name}</p>
                        <p className="text-xs text-gray-500">
                          {selectedUser.online ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Phone className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Chamada de voz</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Video className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Chamada de vídeo</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Info className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Informações do contato</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-auto p-4 space-y-3">
                    {conversations[selectedUser.id]?.messages.map((message, index, array) => {
                      const dateHeader = formatMessageDate(message, index, array);
                      return (
                        <div key={message.id}>
                          {dateHeader && (
                            <div className="text-center my-4">
                              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-gray-500">
                                {dateHeader}
                              </span>
                            </div>
                          )}
                          <div className={cn(
                            "flex flex-col max-w-[70%]",
                            message.sent ? "ml-auto items-end" : "mr-auto items-start"
                          )}>
                            <div className={cn(
                              "rounded-lg py-2 px-3 text-sm message-sent",
                              message.sent 
                                ? "bg-[#e60909] text-white rounded-br-none" 
                                : "bg-gray-100 dark:bg-gray-800 rounded-bl-none message-received"
                            )}>
                              {message.text}
                            </div>
                            <div className="flex items-center mt-1 text-xs text-gray-500 space-x-1">
                              <span>{message.timestamp}</span>
                              {message.sent && (
                                <span>
                                  {message.read ? "✓✓" : "✓"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Message Input */}
                  <div className="border-t p-3 flex gap-2">
                    <Button variant="ghost" size="icon" className="text-gray-500">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input 
                      placeholder="Digite uma mensagem..." 
                      className="focus-visible:ring-[#e60909]"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      className="bg-[#e60909] hover:bg-[#e60909]/90" 
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full flex-col">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
                    <MessageCircle className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium">Selecione um contato</h3>
                  <p className="text-gray-500 mt-2">
                    Escolha um contato da lista para iniciar uma conversa
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Chat;
