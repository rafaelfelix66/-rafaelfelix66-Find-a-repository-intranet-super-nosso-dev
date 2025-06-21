// src/pages/Login.tsx (modificado)
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import InputMask from "react-input-mask"; // Precisamos adicionar esta dependência

export default function Login() {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  //console.log('Formulário submetido:', { cpf, password });
  setIsSubmitting(true);

  try {
    // Remover formatação do CPF
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11) {
      throw new Error("CPF inválido. Informe um CPF com 11 dígitos.");
    }
    
	
    // Garantir que estamos usando o método correto
    await login(cpfLimpo, password);
    
    toast({
      title: "Login bem-sucedido",
      description: "Bem-vindo de volta à Intranet Super Nosso!",
    });
  } catch (error) {
    console.error('Erro de login:', error);
    toast({
      title: "Erro de autenticação",
      description: error instanceof Error ? error.message : "Falha no login. Verifique suas credenciais.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};



  return (
    <div className="min-h-screen flex items-center justify-center bg-supernosso-lightgray">
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
          <img 
            src="/super-nosso-logo.png" 
            alt="Super Nosso Logo" 
            className="h-15 mx-auto mb-4"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://via.placeholder.com/120x40/EA384C/FFFFFF?text=SUPER+NOSSO";
            }}
          />
          <h1 className="text-2xl font-bold text-supernosso-darkgray">Intranet Super Nosso</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Entre com seu CPF e senha para acessar o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <InputMask
                  mask="999.999.999-99"
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link to="/esqueci-senha" className="text-xs text-supernosso-red hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-supernosso-red hover:bg-supernosso-red/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Primeiro acesso?{" "}
              <span className="text-supernosso-red">
                Use seu CPF e os últimos 6 dígitos do CPF como senha inicial
              </span>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}