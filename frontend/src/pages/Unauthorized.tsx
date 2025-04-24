// src/pages/Unauthorized.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <ShieldAlert className="h-16 w-16 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-gray-600 mb-6">
          Você não tem permissão para acessar esta página.
          Entre em contato com o administrador se precisar de acesso.
        </p>
        
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate('/')}>
            Voltar para a Página Inicial
          </Button>
        </div>
      </div>
    </div>
  );
};