// frontend/src/pages/EngagementDashboard.tsx
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OverallEngagementSection } from "@/components/admin/OverallEngagementSection";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell
} from "recharts";
import { api } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Eye, MousePointer, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EngagementData {
  date: string;
  views: number;
  interactions: number;
  uniqueUsers: number;
}

interface ContentStats {
  contentId: string;
  contentType: string;
  title: string;
  views: number;
  interactions: number;
  avgTimeSpent: number;
}

interface ActionStat {
  actionType: string;
  displayName: string;
  description: string;
  count: number;
  totalPoints: number;
  uniqueUsers: number;
}

interface ActiveUser {
  userId: string;
  nome: string;
  departamento: string;
  cargo: string;
  avatar: string;
  totalActions: number;
  views: number;
  interactions: number;
  lastActivity: string;
  postCreations?: number;
}

interface SuperCoinsStats {
  generalStats: {
    totalTransactions: number;
    totalCoinsTransferred: number;
    uniqueSenders: number;
    uniqueReceivers: number;
  };
  dailyTrends: {
    date: string;
    transactions: number;
    coinsTransferred: number;
  }[];
  popularAttributes: {
    attributeId: string;
    name: string;
    description: string;
    cost: number;
    icon: string;
    color: string;
    totalUsed: number;
    totalCoins: number;
  }[];
  topSenders: {
    userId: string;
    name: string;
    department: string;
    avatar: string;
    totalSent: number;
    transactions: number;
  }[];
  topReceivers: {
    userId: string;
    name: string;
    department: string;
    avatar: string;
    totalReceived: number;
    transactions: number;
  }[];
}

// Interface para estatísticas de banner
interface BannerStat {
  bannerId: string;
  title: string;
  description: string;
  views: number;
  clicks: number;
  uniqueViewers: number;
  uniqueClickers: number;
  ctr: number;
}

interface BannerEngagementData {
  period: {
    from: string;
    to: string;
  };
  overall: {
    views: number;
    clicks: number;
    uniqueViewers: number;
    uniqueClickers: number;
    ctr: number;
  };
  dailyStats: {
    date: string;
    views: number;
    clicks: number;
    ctr: number;
  }[];
  bannerStats: BannerStat[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#e60909'];

export default function EngagementDashboard() {
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [contentStats, setContentStats] = useState<ContentStats[]>([]);
  const [selectedContentType, setSelectedContentType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionStats, setActionStats] = useState<ActionStat[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [superCoinsStats, setSuperCoinsStats] = useState<SuperCoinsStats | null>(null);
  const [bannerStats, setBannerStats] = useState<BannerEngagementData | null>(null);
  const [overallStats, setOverallStats] = useState<any>(null);
  
  // Verificar permissões
  useEffect(() => {
    if (!hasPermission('admin:dashboard')) {
      navigate('/unauthorized');
    }
  }, [hasPermission, navigate]);
  
  // Buscar dados de engajamento
  const fetchEngagementData = async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    setLoading(true);
    try {
      const params = {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        contentType: selectedContentType
      };
      
      // Executa todas as requisições em paralelo
      const [timeline, stats, users, coinsStats, actions, banners, overall] = await Promise.all([
        api.get('/admin/engagement/timeline', { params }),
        api.get('/admin/engagement/content-stats', { params }),
        api.get('/admin/engagement/active-users', { params }),
        api.get('/admin/engagement/supercoins-stats', { params }),
        api.get('/admin/engagement/action-stats', { params }),
        api.get('/admin/engagement/banners', { params }),
        api.get('/admin/engagement/overall', { params })
      ]);
      
      setEngagementData(timeline);
      setContentStats(stats);
      setActiveUsers(users);
      setSuperCoinsStats(coinsStats);
      setActionStats(actions);
      setBannerStats(banners);
      setOverallStats(overall);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Efeito para buscar dados quando as dependências mudarem
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchEngagementData();
    }
  }, [dateRange, selectedContentType]);
  
  // Handler para mudança do DateRange
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };

  // Formatador para porcentagens
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  
  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM', { locale: ptBR });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold ml-6">Dashboard de Engajamento</h1>
            <p className="text-muted-foreground ml-6">
              Acompanhe as métricas de uso e engajamento da plataforma
            </p>
          </div>
          
          <div className="flex gap-4">
            <DateRangePicker 
              className="w-[300px]"
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
            <Select value={selectedContentType} onValueChange={setSelectedContentType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="posts">Publicações</SelectItem>
                <SelectItem value="articles">Artigos</SelectItem>
                <SelectItem value="files">Arquivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Cards de métricas gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardDescription>Visualizações Totais</CardDescription>
              <CardTitle className="text-2xl">
                {engagementData.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardDescription>Interações Totais</CardDescription>
              <CardTitle className="text-2xl">
                {engagementData.reduce((sum, item) => sum + item.interactions, 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardDescription>Usuários Únicos</CardDescription>
              <CardTitle className="text-2xl">
                {engagementData.reduce((sum, item) => sum + item.uniqueUsers, 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardDescription>Taxa de Engajamento</CardDescription>
              <CardTitle className="text-2xl">
                {((engagementData.reduce((sum, item) => sum + item.interactions, 0) / 
                  Math.max(1, engagementData.reduce((sum, item) => sum + item.views, 0)) * 100) || 0).toFixed(1)}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
        
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger> 
            <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
            <TabsTrigger value="content">Conteúdo Popular</TabsTrigger>
            <TabsTrigger value="users">Usuários Ativos</TabsTrigger>
            <TabsTrigger value="actions">Tipos de Ações</TabsTrigger>
            <TabsTrigger value="supercoins">Super Coins</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <OverallEngagementSection 
              period={{ 
                from: dateRange.from?.toISOString() || '', 
                to: dateRange.to?.toISOString() || '' 
              }} 
            />
          </TabsContent>
          
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Engajamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e60909]"></div>
                    </div>
                  ) : engagementData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={engagementData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="views" 
                          stroke="#e60909" 
                          name="Visualizações"
                          activeDot={{ r: 8 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="interactions" 
                          stroke="#10b981" 
                          name="Interações"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full text-gray-500">
                      Nenhum dado disponível para o período selecionado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo Mais Popular</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 mb-6">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e60909]"></div>
                    </div>
                  ) : contentStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={contentStats.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="title" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="views" fill="#e60909" name="Visualizações" />
                        <Bar dataKey="interactions" fill="#10b981" name="Interações" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full text-gray-500">
                      Nenhum dado disponível para o período selecionado
                    </div>
                  )}
                </div>
                
                {contentStats.length > 0 && (
                  <div className="space-y-4">
                    {contentStats.map((content, index) => (
                      <div key={content.contentId} className="flex items-center justify-between p-4 border rounded">
                        <div className="flex-1">
                          <p className="font-medium">{content.title}</p>
                          <p className="text-sm text-gray-500">{content.contentType}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-sm text-gray-500">Visualizações</p>
                            <p className="font-medium">{content.views}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Interações</p>
                            <p className="font-medium">{content.interactions}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Tempo médio</p>
                            <p className="font-medium">{Math.round(content.avgTimeSpent)}s</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Mais Ativos</CardTitle>
                <CardDescription>
                  Os 10 usuários com maior atividade no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-60">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e60909]"></div>
                  </div>
                ) : activeUsers.length > 0 ? (
                  <div className="space-y-6">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeUsers.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="nome" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="views" fill="#e60909" name="Visualizações" />
                          <Bar dataKey="interactions" fill="#10b981" name="Interações" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-6">
                      <div className="grid grid-cols-1 gap-4">
                        {activeUsers.map((user) => (
                          <div key={user.userId} className="flex items-center p-4 border rounded">
                            <div className="flex-shrink-0 mr-4">
                              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.nome} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-gray-500 font-medium">
                                    {user.nome.substring(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{user.nome}</p>
                              <p className="text-xs text-gray-500 truncate">{user.departamento} • {user.cargo}</p>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-sm font-medium">{user.totalActions}</p>
                                <p className="text-xs text-gray-500">Ações</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">{user.views}</p>
                                <p className="text-xs text-gray-500">Visualiz.</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">{user.interactions}</p>
                                <p className="text-xs text-gray-500">Interações</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">{user.postCreations || 0}</p>
                                <p className="text-xs text-gray-500">Posts</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-12 text-gray-500">
                    <p>Nenhum dado de usuário disponível para o período selecionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="supercoins">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas Gerais</CardTitle>
                  <CardDescription>
                    Resumo da atividade de Super Coins no período selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e60909]"></div>
                    </div>
                  ) : superCoinsStats ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-gray-500 text-sm">Transações Totais</p>
                        <p className="text-2xl font-bold text-[#e60909]">
                          {superCoinsStats.generalStats.totalTransactions.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-gray-500 text-sm">Moedas Transferidas</p>
                        <p className="text-2xl font-bold text-[#e60909]">
                          {superCoinsStats.generalStats.totalCoinsTransferred.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-gray-500 text-sm">Doadores Únicos</p>
                        <p className="text-2xl font-bold text-[#e60909]">
                          {superCoinsStats.generalStats.uniqueSenders.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-gray-500 text-sm">Recebedores Únicos</p>
                        <p className="text-2xl font-bold text-[#e60909]">
                          {superCoinsStats.generalStats.uniqueReceivers.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-gray-500">
                      <p>Nenhum dado disponível para o período selecionado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Tendência Diária</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-60">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e60909]"></div>
                    </div>
                  ) : superCoinsStats && superCoinsStats.dailyTrends.length > 0 ? (
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={superCoinsStats.dailyTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="transactions" 
                            stroke="#10b981" 
                            name="Transações"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="coinsTransferred" 
                            stroke="#e60909" 
                            name="Moedas"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center p-12 text-gray-500">
                      <p>Nenhum dado de tendência disponível</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Atributos Mais Populares</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-60">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e60909]"></div>
                    </div>
                  ) : superCoinsStats && superCoinsStats.popularAttributes.length > 0 ? (
                    <div className="space-y-6">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={superCoinsStats.popularAttributes}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="totalUsed" fill="#e60909" name="Vezes Usado" />
                            <Bar dataKey="totalCoins" fill="#10b981" name="Total de Moedas" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {superCoinsStats.popularAttributes.map((attr) => (
                          <div key={attr.attributeId} className="flex items-center p-4 border rounded">
                            <div className="flex-shrink-0 mr-4">
                              <div 
                                className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: attr.color || '#e60909' }}
                              >
                                {attr.icon ? attr.icon : attr.name.substring(0, 1).toUpperCase()}
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <p className="font-medium">{attr.name}</p>
                              <p className="text-xs text-gray-500">{attr.description}</p>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-medium">{attr.totalUsed} usos</p>
                              <p className="text-xs text-gray-500">{attr.totalCoins} moedas</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-12 text-gray-500">
                      <p>Nenhum dado de atributo disponível</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Maiores Doadores</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e60909]"></div>
                    </div>
                  ) : superCoinsStats && superCoinsStats.topSenders.length > 0 ? (
                    <div className="space-y-4">
                      {superCoinsStats.topSenders.map((user, idx) => (
                        <div key={user.userId} className="flex items-center p-3 border rounded">
                          <div className="flex-shrink-0 mr-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-gray-500 font-medium">
                                  {user.name.substring(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.department}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-[#e60909]">{user.totalSent} moedas</p>
                            <p className="text-xs text-gray-500">{user.transactions} transações</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 text-gray-500">
                      <p>Nenhum dado disponível</p>
                    </div>
                  )}
                </CardContent>
              </Card>
			  
			  <Card>
                <CardHeader>
                  <CardTitle>Maiores Recebedores</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e60909]"></div>
                    </div>
                  ) : superCoinsStats && superCoinsStats.topReceivers.length > 0 ? (
                    <div className="space-y-4">
                      {superCoinsStats.topReceivers.map((user, idx) => (
                        <div key={user.userId} className="flex items-center p-3 border rounded">
                          <div className="flex-shrink-0 mr-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-gray-500 font-medium">
                                  {user.name.substring(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.department}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-green-600">{user.totalReceived} moedas</p>
                            <p className="text-xs text-gray-500">{user.transactions} transações</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 text-gray-500">
                      <p>Nenhum dado disponível</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas por Tipo de Ação</CardTitle>
                <CardDescription>
                  Distribuição de engajamento por tipo de ação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-60">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e60909]"></div>
                  </div>
                ) : actionStats && actionStats.length > 0 ? (
                  <div className="space-y-6">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={actionStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="displayName" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#e60909" name="Ocorrências" />
                          <Bar dataKey="totalPoints" fill="#10b981" name="Pontos Totais" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {actionStats.map((action) => (
                        <div key={action.actionType} className="flex items-center p-4 border rounded">
                          <div className="flex-1">
                            <p className="font-medium">{action.displayName}</p>
                            <p className="text-xs text-gray-500">{action.description || action.actionType}</p>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-sm text-gray-500">Ocorrências</p>
                              <p className="font-medium">{action.count}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Pontos</p>
                              <p className="font-medium">{action.totalPoints}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Usuários</p>
                              <p className="font-medium">{action.uniqueUsers}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-12 text-gray-500">
                    <p>Nenhum dado de ação disponível para o período selecionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Nova aba para banners */}
          <TabsContent value="banners">
            <Card>
              <CardHeader>
                <CardTitle>Engajamento com Banners</CardTitle>
                <CardDescription>
                  Visão geral do engajamento com banners na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-60">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e60909]"></div>
                  </div>
                ) : bannerStats ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <div className="mr-3 p-2 bg-blue-100 rounded-lg">
                            <Eye className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">Visualizações</p>
                            <p className="text-xl font-semibold">{bannerStats.overall.views}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <div className="mr-3 p-2 bg-green-100 rounded-lg">
                            <MousePointer className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">Cliques</p>
                            <p className="text-xl font-semibold">{bannerStats.overall.clicks}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <div className="mr-3 p-2 bg-purple-100 rounded-lg">
                            <BarChart2 className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">Taxa de Cliques (CTR)</p>
                            <p className="text-xl font-semibold">{formatPercent(bannerStats.overall.ctr)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Evolução Diária</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={bannerStats.dailyStats}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={formatDate}
                            />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip
                              formatter={(value, name) => [value, name]}
                              labelFormatter={(label) => formatDate(label)}
                            />
                            <Legend />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="views"
                              name="Visualizações"
                              stroke="#0088FE"
                              activeDot={{ r: 8 }}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="clicks"
                              name="Cliques"
                              stroke="#00C49F"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Banners Mais Populares</h3>
                      <div className="overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Banner</TableHead>
                              <TableHead>Visualizações</TableHead>
                              <TableHead>Cliques</TableHead>
                              <TableHead>CTR</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bannerStats.bannerStats.slice(0, 5).map((banner) => (
                              <TableRow key={banner.bannerId}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{banner.title}</p>
                                    <p className="text-sm text-gray-500 truncate max-w-[300px]">
                                      {banner.description}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {banner.views}
                                  <p className="text-xs text-gray-500">
                                    {banner.uniqueViewers} únicos
                                  </p>
                                </TableCell>
                                <TableCell>
                                  {banner.clicks}
                                  <p className="text-xs text-gray-500">
                                    {banner.uniqueClickers} únicos
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      banner.ctr > 5
                                        ? "bg-green-100 text-green-800"
                                        : banner.ctr > 2
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                    }
                                  >
                                    {formatPercent(banner.ctr)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                            {bannerStats.bannerStats.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                  Nenhum dado disponível para o período selecionado
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="h-80 mt-6">
                        <h3 className="text-lg font-medium mb-3">Comparativo de Desempenho</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={bannerStats.bannerStats.slice(0, 5)}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="title" 
                              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                            />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="views" name="Visualizações" fill="#0088FE">
                              {bannerStats.bannerStats.slice(0, 5).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                            <Bar dataKey="clicks" name="Cliques" fill="#00C49F">
                              {bannerStats.bannerStats.slice(0, 5).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-12 text-gray-500">
                    <p>Nenhum dado de banner disponível para o período selecionado</p>
                    <Button 
                      className="mt-4" 
                      onClick={fetchEngagementData}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}