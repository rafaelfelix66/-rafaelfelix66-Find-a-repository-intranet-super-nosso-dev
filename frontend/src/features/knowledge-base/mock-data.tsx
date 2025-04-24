
import React from "react";
import { Article, Category } from "./types";
import { Book, File, BookOpen, FileQuestion } from "lucide-react";

export const mockArticles: Article[] = [
  {
    id: "1",
    title: "Como utilizar o sistema de estoque",
    description: "Guia completo sobre como utilizar o sistema de gestão de estoque da empresa.",
    categoryId: "sistemas",
    tags: ["estoque", "sistema", "gestão"],
    views: 342,
    date: "10/05/2023",
    favorite: true,
    pinned: true,
    author: {
      name: "João Silva",
      avatar: ""
    },
    content: `
# Sistema de Gestão de Estoque

## Introdução
Este guia foi desenvolvido para auxiliar os colaboradores da empresa a utilizar corretamente o sistema de gestão de estoque.

## Como acessar
1. Acesse o portal interno da empresa
2. Clique em "Sistemas" no menu principal
3. Selecione "Gestão de Estoque"
4. Faça login com suas credenciais

## Funcionalidades principais
- Cadastro de produtos
- Controle de entrada e saída
- Relatórios de movimentação
- Alertas de estoque mínimo
- Integração com sistema de vendas

## Dúvidas frequentes
Para mais informações, consulte a equipe de TI ou envie um e-mail para suporte@empresa.com.br
    `
  },
  {
    id: "2",
    title: "Política de férias e folgas",
    description: "Entenda como funciona o sistema de férias, folgas e bancos de horas da empresa.",
    categoryId: "rh",
    tags: ["férias", "folgas", "recursos humanos"],
    views: 289,
    date: "05/06/2023",
    favorite: false,
    pinned: false,
    author: {
      name: "Maria Santos",
      avatar: ""
    },
    content: `
# Política de Férias e Folgas

## Direito a férias
Todos os colaboradores têm direito a 30 dias de férias após completar 12 meses de trabalho.

## Fracionamento
As férias podem ser fracionadas em até 3 períodos, sendo que um deles não pode ser inferior a 14 dias.

## Solicitação
A solicitação de férias deve ser feita com pelo menos 30 dias de antecedência através do portal do colaborador.

## Banco de horas
As horas extras trabalhadas podem ser compensadas no prazo de 6 meses.

## Folgas
Cada colaborador tem direito a 1 dia de folga no mês do seu aniversário.
    `
  }
];

export const categories: Category[] = [
  { id: "sistemas", name: "Sistemas", icon: <File className="h-4 w-4" />, count: 15, color: "blue-500" },
  { id: "rh", name: "RH", icon: <BookOpen className="h-4 w-4" />, count: 24, color: "green-500" },
  { id: "atendimento", name: "Atendimento", icon: <FileQuestion className="h-4 w-4" />, count: 18, color: "purple-500" },
  { id: "operacional", name: "Operacional", icon: <Book className="h-4 w-4" />, count: 32, color: "orange-500" },
  { id: "seguranca", name: "Segurança", icon: <FileQuestion className="h-4 w-4" />, count: 12, color: "red-500" }
];
