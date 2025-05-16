// frontend/src/pages/EngagementDashboard.tsx
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Corrigindo as importações do Recharts - certifique-se de importar tudo que está sendo usado
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
  CartesianGrid 
} from "recharts";
import { api } from "@/services/api";
import { usePermission } from "@/hooks/usePermission";
import { useNavigate } from "react-router-dom";

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
// Adicione interfaces para os novos tipos de dados
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

export default function EngagementDashboard() {
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [contentStats, setContentStats] = useState<ContentStats[]>([]);
  const [selectedContentType, setSelectedContentType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionStats, setActionStats] = useState<ActionStat[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [superCoinsStats, setSuperCoinsStats] = useState<SuperCoinsStats | null>(null);
  
  // Verificar permissões
  useEffect(() => {
    if (!hasPermission('admin:dashboard')) {
      navigate('/unauthorized');
    }
  }, [hasPermission, navigate]);
  
  // Buscar dados de engajamento
  const fetchEngagementData = async () => {
    setLoading(true);
    try {
      const params = {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        contentType: selectedContentType
      };
      
      const [timeline, stats] = await Promise.all([
        api.get('/admin/engagement/timeline', { params }),
        api.get('/admin/engagement/content-stats', { params }),
		api.get('/admin/engagement/active-users', { params }),
        api.get('/admin/engagement/supercoins-stats', { params }),
        api.get('/admin/engagement/action-stats', { params })
      ]);
      
      setEngagementData(timeline);
      setContentStats(stats);
	  setActiveUsers(users);
      setSuperCoinsStats(coinsStats);
	  setActionStats(actions);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEngagementData();
  }, [dateRange, selectedContentType]);
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard de Engajamento</h1>
            <p className="text-muted-foreground">
              Acompanhe as métricas de uso e engajamento da plataforma
            </p>
          </div>
          
          <div className="flex gap-4">
            <DateRangePicker 
              value={dateRange}
              onChange={setDateRange}
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
                  engagementData.reduce((sum, item) => sum + item.views, 0) * 100) || 0).toFixed(1)}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
        
        <Tabs defaultValue="timeline">
          <TabsList>
            <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
            <TabsTrigger value="content">Conteúdo Popular</TabsTrigger>
            <TabsTrigger value="users">Usuários Ativos</TabsTrigger>
			<TabsTrigger value="actions">Tipos de Ações</TabsTrigger>
            <TabsTrigger value="supercoins">Super Coins</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Engajamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
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
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={contentStats.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line dataKey="views" stroke="#e60909" name="Visualizações" />
                      <Line dataKey="interactions" stroke="#10b981" name="Interações" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
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
						  <LineChart  data={activeUsers.slice(0, 10)}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="nome" />
							<YAxis />
							<Tooltip />
							<Legend />
							<Line dataKey="views" stroke="#e60909" name="Visualizações" />
							<Line dataKey="interactions" stroke="#10b981" name="Interações" />
						  </LineChart >
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
							  
							  <div className="grid grid-cols-5 gap-4 text-center">
								<div>
								  <p className="text-sm font-medium">{user.totalPoints}</p>
								  <p className="text-xs text-gray-500">Pontos</p>
								</div>
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
								  <p className="text-sm font-medium">{user.postCreations}</p>
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
							<LineChart data={superCoinsStats.popularAttributes}>
							  <CartesianGrid strokeDasharray="3 3" />
							  <XAxis dataKey="name" />
							  <YAxis />
							  <Tooltip />
							  <Legend />
							  <Line dataKey="totalUsed" stroke="#e60909" name="Vezes Usado" />
							  <Line dataKey="totalCoins" stroke="#10b981" name="Total de Moedas" />
							</LineChart>
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
						  <LineChart data={actionStats}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="displayName" />
							<YAxis />
							<Tooltip />
							<Legend />
							<Line dataKey="count" stroke="#e60909" name="Ocorrências" />
							<Line dataKey="totalPoints" stroke="#10b981" name="Pontos Totais" />
						  </LineChart>
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
        </Tabs>
      </div>
    </Layout>
  );
}