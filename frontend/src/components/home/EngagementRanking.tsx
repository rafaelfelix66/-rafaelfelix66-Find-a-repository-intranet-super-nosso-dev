// frontend/src/components/home/EngagementRanking.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Award, TrendingUp, Trophy } from "lucide-react";
import { api } from "@/lib/api";

interface RankingUser {
  userId: string;
  userName: string;
  userDepartment?: string;
  userAvatar?: string;
  totalPoints: number;
  actionsCount: number;
}

export function EngagementRanking() {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [period, setPeriod] = useState("month");
  const [showFullRanking, setShowFullRanking] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const fetchRanking = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/engagement/ranking?period=${period}&limit=10`);
      setRanking(response);
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRanking();
  }, [period]);
  
  const getIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Trophy className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Trophy className="h-5 w-5 text-amber-700" />;
      default:
        return <Award className="h-5 w-5 text-gray-400" />;
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#e60909]" />
              <span>Top Engajamento</span>
            </div>
            
            <div className="flex gap-1">
              <Button
                variant={period === "week" ? "default" : "outline"}
                size="sm"
                className={period === "week" ? "text-xs bg-[#e60909] hover:bg-[#e60909]/90" : "text-xs"}
                onClick={() => setPeriod("week")}
              >
                Semana
              </Button>
              <Button
                variant={period === "month" ? "default" : "outline"}
                size="sm"
                className={period === "month" ? "text-xs bg-[#e60909] hover:bg-[#e60909]/90" : "text-xs"}
                onClick={() => setPeriod("month")}
              >
                Mês
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#e60909]"></div>
            </div>
          ) : ranking.length > 0 ? (
            <>
              <div className="space-y-2">
                {ranking.slice(0, 5).map((user, index) => (
                  <div key={user.userId} className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="mr-2 font-medium text-gray-500 w-6 text-center flex justify-center">
                      {getIcon(index)}
                    </div>
                    <UserAvatar 
                      size="sm"
                      user={{
                        name: user.userName,
                        avatar: user.userAvatar,
                        department: user.userDepartment
                      }}
                    />
                    <div className="ml-2 flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.userName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-[#e60909]/10 text-[#e60909] border-0">
                        {user.totalPoints} pts
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-[#e60909] hover:text-[#e60909] hover:bg-[#e60909]/10"
                onClick={() => setShowFullRanking(true)}
              >
                Ver ranking completo
              </Button>
            </>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>Nenhum dado disponível</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal para o ranking completo */}
      <Dialog open={showFullRanking} onOpenChange={setShowFullRanking}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ranking de Engajamento</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="month" value={period} onValueChange={setPeriod}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="day">Hoje</TabsTrigger>
              <TabsTrigger value="week">Esta Semana</TabsTrigger>
              <TabsTrigger value="month">Este Mês</TabsTrigger>
            </TabsList>
            
            <TabsContent value={period} className="pt-4">
              <div className="space-y-4">
                {ranking.map((user, index) => (
                  <div key={user.userId} className="flex items-center p-3 border rounded-lg">
                    <div className="mr-3 font-bold text-lg text-gray-500 w-6 text-center">
                      {index + 1}
                    </div>
                    <UserAvatar 
                      user={{
                        name: user.userName,
                        avatar: user.userAvatar,
                        department: user.userDepartment
                      }}
                      size="md"
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-medium">{user.userName}</p>
                      {user.userDepartment && (
                        <p className="text-xs text-gray-500">{user.userDepartment}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#e60909]">{user.totalPoints}</p>
                      <div className="flex gap-2 justify-end">
                        <Badge variant="outline">
                          {user.actionsCount} ações
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                
                {ranking.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <p>Nenhum resultado disponível</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}