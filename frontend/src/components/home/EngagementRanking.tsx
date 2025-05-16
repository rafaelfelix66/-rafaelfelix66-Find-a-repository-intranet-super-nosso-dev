//frontend/src/components/home/EngagementRanking.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Users, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/services/api";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";

interface RankingUser {
  userId: string;
  userName: string;
  userAvatar?: string;
  userDepartment?: string;
  totalPoints: number;
  actionsCount: number;
}

export function EngagementRanking() {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [showFullRanking, setShowFullRanking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchRanking = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Buscando ranking para o período:", period);
      const response = await api.get(`/engagement/ranking?period=${period}&limit=10`);
      console.log("Resposta do ranking:", response);
      
      if (Array.isArray(response)) {
        setRanking(response);
      } else {
        console.error("Resposta não é um array:", response);
        setRanking([]);
      }
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      setError("Não foi possível carregar o ranking. Tente novamente mais tarde.");
      setRanking([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRanking();
  }, [period]);
  
  const getRankIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Trophy className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Trophy className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-gray-500">#{position + 1}</span>;
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#e60909]" />
              Colaboradores mais Engajados
            </CardTitle>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Hoje</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
                <SelectItem value="all">Sempre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          {loading ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Carregando ranking...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              <p className="text-sm">{error}</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={fetchRanking}
              >
                Tentar novamente
              </Button>
            </div>
          ) : ranking.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Nenhum dado de engajamento encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ranking.slice(0, 5).map((user, index) => (
                <div key={user.userId} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getRankIcon(index)}
                  </div>
                  <UserAvatar 
                    user={{
                      name: user.userName,
                      avatar: user.userAvatar,
                      department: user.userDepartment
                    }}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.userName}</p>
                    <p className="text-xs text-gray-500">{user.totalPoints} pontos</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.actionsCount} ações
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardContent className="pt-2">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowFullRanking(true)}
          >
            Ver ranking completo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
      
      {/* Modal com ranking completo */}
      <Dialog open={showFullRanking} onOpenChange={setShowFullRanking}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ranking Completo de Engajamento</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {loading ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Carregando ranking completo...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">
                <p className="text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={fetchRanking}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : ranking.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Nenhum dado de engajamento encontrado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Mostrando ranking para o período: {
                    period === 'day' ? 'Hoje' :
                    period === 'week' ? 'Esta semana' :
                    period === 'month' ? 'Este mês' :
                    period === 'year' ? 'Este ano' : 'Todo o período'
                  }
                </p>
                
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Posição</th>
                      <th className="text-left py-2">Colaborador</th>
                      <th className="text-left py-2">Departamento</th>
                      <th className="text-right py-2">Pontos</th>
                      <th className="text-right py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((user, index) => (
                      <tr key={user.userId} className="border-b hover:bg-gray-50">
                        <td className="py-3 flex items-center">
                          {getRankIcon(index)}
                        </td>
                        <td className="py-3 flex items-center gap-2">
                          <UserAvatar 
                            user={{
                              name: user.userName,
                              avatar: user.userAvatar
                            }}
                            size="sm"
                          />
                          <span className="font-medium">{user.userName}</span>
                        </td>
                        <td className="py-3 text-gray-600">{user.userDepartment || 'N/A'}</td>
                        <td className="py-3 text-right font-medium">{user.totalPoints}</td>
                        <td className="py-3 text-right text-gray-600">{user.actionsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}