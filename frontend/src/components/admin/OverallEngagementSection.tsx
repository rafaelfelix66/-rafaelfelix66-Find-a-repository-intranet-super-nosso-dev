// frontend/src/components/admin/OverallEngagementSection.tsx
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  Users, 
  Award, 
  BarChart2, 
  Eye, 
  MousePointer, 
  FileText, 
  Files, 
  Image 
} from "lucide-react";

interface OverallEngagementProps {
  period: {
    from: string;
    to: string;
  };
}

interface EngagementStats {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalActions: number;
    uniqueUsers: number;
    totalPoints: number;
  };
  actionCounts: {
    type: string;
    count: number;
    uniqueUsers: number;
  }[];
  categoryCounts: {
    content: number;
    files: number;
    banners: number;
    system: number;
  };
  bannerEngagement: {
    views: number;
    clicks: number;
    ctr: number;
  };
  dailyTrends: {
    date: string;
    total: number;
    content: number;
    files: number;
    banners: number;
    system: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#e60909'];
const CATEGORY_COLORS = {
  content: '#0088FE',
  files: '#00C49F',
  banners: '#FFBB28',
  system: '#FF8042'
};

export const OverallEngagementSection: React.FC<OverallEngagementProps> = ({ period }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EngagementStats | null>(null);
  
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/admin/engagement/overall', {
        params: {
          from: period.from,
          to: period.to
        }
      });
      
      setData(response);
    } catch (error) {
      console.error('Erro ao buscar estatísticas gerais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas gerais de engajamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStats();
  }, [period]);
  
  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM', { locale: ptBR });
  };
  
  // Formatador para porcentagens
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  
  // Preparar dados para o gráfico de pizza de categorias
  const prepareCategoryData = () => {
    if (!data) return [];
    
    return Object.entries(data.categoryCounts).map(([category, count]) => ({
      name: category,
      value: count
    }));
  };
  
  if (loading) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Visão Geral de Engajamento</CardTitle>
          <CardDescription>Carregando estatísticas...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supernosso-red"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Visão Geral de Engajamento</CardTitle>
          <CardDescription>Não foi possível carregar as estatísticas</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-4">Ocorreu um erro ao buscar os dados</p>
          <button 
            className="px-4 py-2 bg-supernosso-red text-white rounded-md"
            onClick={fetchStats}
          >
            Tentar novamente
          </button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Visão Geral de Engajamento</CardTitle>
          <CardDescription>
            Resumo da atividade dos usuários na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="mr-3 p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Total de Ações</p>
                  <p className="text-xl font-semibold">{data.summary.totalActions}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="mr-3 p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Usuários Ativos</p>
                  <p className="text-xl font-semibold">{data.summary.uniqueUsers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="mr-3 p-2 bg-purple-100 rounded-lg">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Pontos de Engajamento</p>
                  <p className="text-xl font-semibold">{data.summary.totalPoints}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="mr-3 p-2 bg-yellow-100 rounded-lg">
                  <BarChart2 className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">CTR de Banners</p>
                  <p className="text-xl font-semibold">{formatPercent(data.bannerEngagement.ctr)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Tendências de Engajamento</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.dailyTrends}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [value, '']}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total"
                      stroke="#e60909"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="content"
                      name="Conteúdo"
                      stroke={CATEGORY_COLORS.content}
                    />
                    <Line
                      type="monotone"
                      dataKey="files"
                      name="Arquivos"
                      stroke={CATEGORY_COLORS.files}
                    />
                    <Line
                      type="monotone"
                      dataKey="banners"
                      name="Banners"
                      stroke={CATEGORY_COLORS.banners}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Distribuição por Categoria</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => {
                        const displayName = {
                          content: 'Conteúdo',
                          files: 'Arquivos',
                          banners: 'Banners',
                          system: 'Sistema'
                        }[name] || name;
                        
                        return `${displayName}: ${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareCategoryData().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Destaques de Banners</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="mr-3 p-2 bg-blue-100 rounded-full">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Visualizações de Banners</p>
                    <p className="text-lg font-semibold">{data.bannerEngagement.views}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="mr-3 p-2 bg-green-100 rounded-full">
                    <MousePointer className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cliques em Banners</p>
                    <p className="text-lg font-semibold">{data.bannerEngagement.clicks}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="mr-3 p-2 bg-amber-100 rounded-full">
                    <Image className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">% do Engajamento Total</p>
                    <p className="text-lg font-semibold">
                      {formatPercent((data.categoryCounts.banners / data.summary.totalActions) * 100)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};