// frontend/src/components/admin/BannerEngagementSection.tsx
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
  Cell,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Eye, MousePointer, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface BannerEngagementProps {
  period: {
    from: string;
    to: string;
  };
}

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

export const BannerEngagementSection: React.FC<BannerEngagementProps> = ({ period }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BannerEngagementData | null>(null);
  
  const fetchBannerStats = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/admin/engagement/banners', {
        params: {
          from: period.from,
          to: period.to
        }
      });
      
      setData(response);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de banners:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas de banners",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBannerStats();
  }, [period]);
  
  // Formatador para porcentagens
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  
  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM', { locale: ptBR });
  };
  
  if (loading) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Estatísticas de Banners</CardTitle>
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
          <CardTitle>Estatísticas de Banners</CardTitle>
          <CardDescription>Não foi possível carregar as estatísticas</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-4">Ocorreu um erro ao buscar os dados</p>
          <Button onClick={fetchBannerStats}>Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Engajamento com Banners</CardTitle>
          <CardDescription>
            Visão geral do engajamento com banners na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="mr-3 p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Visualizações</p>
                  <p className="text-xl font-semibold">{data.overall.views}</p>
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
                  <p className="text-xl font-semibold">{data.overall.clicks}</p>
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
                  <p className="text-xl font-semibold">{formatPercent(data.overall.ctr)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Evolução Diária</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.dailyStats}
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
                  {data.bannerStats.slice(0, 5).map((banner) => (
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
                  {data.bannerStats.length === 0 && (
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
                  data={data.bannerStats.slice(0, 5)}
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
                    {data.bannerStats.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                  <Bar dataKey="clicks" name="Cliques" fill="#00C49F">
                    {data.bannerStats.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};