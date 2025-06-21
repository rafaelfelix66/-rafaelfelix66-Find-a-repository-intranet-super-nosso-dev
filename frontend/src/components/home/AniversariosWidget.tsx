// frontend/src/components/home/AniversariosWidget.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Briefcase, Calendar } from "lucide-react";
import { api } from "@/services/api";
import { Badge } from "@/components/ui/badge";

interface Aniversariante {
  _id: string;
  nome: string;
  tipo: 'nascimento' | 'admissao';
  data: string;
  anos?: number;
}

export const AniversariosWidget: React.FC = () => {
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAniversariantes();
  }, []);

  const fetchAniversariantes = async () => {
    try {
      console.log('Iniciando busca de aniversariantes...');
      const response = await api.get('/usuarios/aniversariantes');
      console.log('Resposta recebida:', response);
      
      // Processar os dados recebidos
      const aniversariantesProcessados: Aniversariante[] = [];
      
      // A resposta já é o array direto por causa do interceptor do axios
      if (Array.isArray(response)) {
        console.log(`Processando ${response.length} usuários`);
        
        response.forEach((usuario: any) => {
          console.log('Processando usuário:', usuario);
          
          // Verificar aniversário de nascimento
          if (usuario.dataNascimento) {
            // Extrair apenas a data sem considerar timezone
            const dataString = usuario.dataNascimento.split('T')[0]; // Pega "1991-05-13"
            const [ano, mes, dia] = dataString.split('-').map(Number);
            const hoje = new Date();
            
            console.log(`Verificando nascimento de ${usuario.nome}:`);
            console.log(`Data nascimento: ${dia}/${mes}/${ano}`);
            console.log(`Data hoje: ${hoje.getDate()}/${hoje.getMonth() + 1}/${hoje.getFullYear()}`);
            
            if (dia === hoje.getDate() && (mes - 1) === hoje.getMonth()) {
              const idade = hoje.getFullYear() - ano;
              aniversariantesProcessados.push({
                _id: usuario._id,
                nome: usuario.nome,
                tipo: 'nascimento',
                data: usuario.dataNascimento,
                anos: idade
              });
              console.log(`Adicionado aniversário de nascimento: ${usuario.nome}, ${idade} anos`);
            }
          }
          
          // Verificar aniversário de empresa
          if (usuario.dataAdmissao) {
            // Extrair apenas a data sem considerar timezone
            const dataString = usuario.dataAdmissao.split('T')[0]; // Pega "2015-05-13"
            const [ano, mes, dia] = dataString.split('-').map(Number);
            const hoje = new Date();
            
            console.log(`Verificando admissão de ${usuario.nome}:`);
            console.log(`Data admissão: ${dia}/${mes}/${ano}`);
            console.log(`Data hoje: ${hoje.getDate()}/${hoje.getMonth() + 1}/${hoje.getFullYear()}`);
            
            if (dia === hoje.getDate() && (mes - 1) === hoje.getMonth()) {
              const anosEmpresa = hoje.getFullYear() - ano;
              aniversariantesProcessados.push({
                _id: usuario._id,
                nome: usuario.nome,
                tipo: 'admissao',
                data: usuario.dataAdmissao,
                anos: anosEmpresa
              });
              console.log(`Adicionado aniversário de empresa: ${usuario.nome}, ${anosEmpresa} anos`);
            }
          }
        });
      } else {
        console.log('Resposta não é um array:', response);
      }
      
      console.log('Aniversariantes processados final:', aniversariantesProcessados);
      setAniversariantes(aniversariantesProcessados);
    } catch (error) {
      console.error('Erro ao buscar aniversariantes:', error);
    } finally {
      setLoading(false);
    }
  };

  console.log('Estado atual dos aniversariantes:', aniversariantes);
  console.log('Loading:', loading);

  // Debug - sempre mostrar algo para testar
  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-[#870f0b]" />
          Aniversariantes do Dia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-sm text-gray-500">Carregando...</div>
        ) : aniversariantes.length === 0 ? (
          <div className="text-sm text-gray-500">Nenhum aniversariante hoje</div>
        ) : (
          aniversariantes.map((aniversariante) => (
            <div key={`${aniversariante._id}-${aniversariante.tipo}`} 
                 className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                {aniversariante.tipo === 'nascimento' ? (
                  <Gift className="h-5 w-5 text-blue-500" />
                ) : (
                  <Briefcase className="h-5 w-5 text-green-500" />
                )}
                <div>
                  <p className="font-medium">{aniversariante.nome}</p>
                  <p className="text-sm text-gray-500">
                    {aniversariante.tipo === 'nascimento' 
                      ? 'Aniversário' 
                      : aniversariante.anos === 1 
                        ? '1 ano de empresa' 
                        : `${aniversariante.anos} anos de empresa`}
                  </p>
                </div>
              </div>
              <Badge 
                variant={aniversariante.tipo === 'nascimento' ? 'default' : 'secondary'}
                className={aniversariante.tipo === 'nascimento' ? 'bg-blue-500' : 'bg-green-500'}
              >
                {aniversariante.tipo === 'nascimento' ? 'Aniversário' : 'Empresa'}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};