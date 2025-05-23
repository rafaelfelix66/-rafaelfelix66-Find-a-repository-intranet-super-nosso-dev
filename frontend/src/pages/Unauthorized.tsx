// src/pages/Unauthorized.tsx - Página de acesso negado
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Home, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleGoHome = () => {
    navigate('/', { replace: true });
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Acesso Negado
          </CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta página ou funcionalidade.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {user && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p className="text-gray-600">
                Conectado como: <span className="font-medium">{user.name}</span>
              </p>
              {user.cargo && (
                <p className="text-gray-600">
                  Cargo: <span className="font-medium">{user.cargo}</span>
                </p>
              )}
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <p>Se você acredita que deveria ter acesso a esta área, entre em contato com o administrador do sistema.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={handleGoBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button 
              className="flex-1 bg-[#e60909] hover:bg-[#e60909]/90"
              onClick={handleGoHome}
            >
              <Home className="mr-2 h-4 w-4" />
              Ir para Início
            </Button>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Precisa de ajuda? Entre em contato com o suporte técnico.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}