// /backend/scripts/seedEngagementData.js
const mongoose = require('mongoose');
const { User } = require('../models');
const { Engagement, EngagementAction } = require('../models/Engagement');
const { 
  SuperCoinTransaction, 
  SuperCoinAttribute, 
  SuperCoinBalance, 
  SuperCoinConfig
} = require('../models/SuperCoin');
require('dotenv').config();

// Função auxiliar para gerar data aleatória nos últimos dias
const randomDate = (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date;
};

// Função para conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');
  } catch (err) {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  }
};

// Função para criar ações de engajamento
const seedEngagementActions = async () => {
  try {
    // Limpar ações existentes
    await EngagementAction.deleteMany({});
    
    // Criar ações padrão
    const actions = [
      {
        actionType: 'post_view',
        displayName: 'Visualização de Post',
        points: 1,
        description: 'Visualizar uma publicação na timeline'
      },
      {
        actionType: 'post_create',
        displayName: 'Criar Post',
        points: 5,
        description: 'Criar uma nova publicação na timeline'
      },
      {
        actionType: 'post_like',
        displayName: 'Curtir Post',
        points: 2,
        description: 'Curtir uma publicação na timeline'
      },
      {
        actionType: 'post_comment',
        displayName: 'Comentar Post',
        points: 3,
        description: 'Comentar em uma publicação na timeline'
      },
      {
        actionType: 'article_view',
        displayName: 'Visualização de Artigo',
        points: 1,
        description: 'Visualizar um artigo na base de conhecimento'
      },
      {
        actionType: 'article_create',
        displayName: 'Criar Artigo',
        points: 10,
        description: 'Criar um novo artigo na base de conhecimento'
      },
      {
        actionType: 'file_view',
        displayName: 'Visualização de Arquivo',
        points: 1,
        description: 'Visualizar um arquivo no armazenamento'
      },
      {
        actionType: 'file_download',
        displayName: 'Download de Arquivo',
        points: 2,
        description: 'Baixar um arquivo do armazenamento'
      },
      {
        actionType: 'file_share',
        displayName: 'Compartilhar Arquivo',
        points: 3,
        description: 'Compartilhar um arquivo com outro usuário'
      },
      {
        actionType: 'login',
        displayName: 'Login no Sistema',
        points: 1,
        description: 'Entrar no sistema'
      },
      {
        actionType: 'profile_update',
        displayName: 'Atualizar Perfil',
        points: 2,
        description: 'Atualizar informações do perfil'
      }
    ];
    
    await EngagementAction.insertMany(actions);
    console.log(`${actions.length} ações de engajamento criadas`);
  } catch (err) {
    console.error('Erro ao criar ações de engajamento:', err);
  }
};

// Função para criar registros de engajamento aleatórios
const seedEngagementRecords = async () => {
  try {
    // Limpar registros existentes
    await Engagement.deleteMany({});
    
    // Buscar usuários
    const users = await User.find({}).limit(20);
    if (!users.length) {
      console.log('Nenhum usuário encontrado. Verifique se existem usuários no banco de dados.');
      return;
    }
    
    // Buscar ações
    const actions = await EngagementAction.find({});
    if (!actions.length) {
      console.log('Nenhuma ação encontrada. Execute seedEngagementActions primeiro.');
      return;
    }
    
    // Gerar registros aleatórios
    const engagementRecords = [];
    
    // Para cada usuário, gerar vários registros
    for (const user of users) {
      // Número aleatório de registros para cada usuário (10-50)
      const recordsCount = 10 + Math.floor(Math.random() * 40);
      
      for (let i = 0; i < recordsCount; i++) {
        // Selecionar ação aleatória
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        engagementRecords.push({
          userId: user._id,
          actionType: action.actionType,
          points: action.points,
          timestamp: randomDate(30)
        });
      }
    }
    
    // Inserir todos os registros
    await Engagement.insertMany(engagementRecords);
    console.log(`${engagementRecords.length} registros de engajamento criados`);
  } catch (err) {
    console.error('Erro ao criar registros de engajamento:', err);
  }
};

// Função para criar atributos de SuperCoin
const seedSuperCoinAttributes = async () => {
  try {
    // Limpar atributos existentes
    await SuperCoinAttribute.deleteMany({});
    
    // Criar atributos padrão
    const attributes = [
      {
        name: 'Inovação',
        description: 'Pensamento criativo e soluções inovadoras',
        cost: 5,
        icon: '💡',
        color: '#FFD700' // Gold
      },
      {
        name: 'Colaboração',
        description: 'Trabalho em equipe e suporte aos colegas',
        cost: 3,
        icon: '🤝',
        color: '#4169E1' // Royal Blue
      },
      {
        name: 'Excelência',
        description: 'Entregando resultados de alta qualidade',
        cost: 8,
        icon: '🌟',
        color: '#9932CC' // Purple
      },
      {
        name: 'Proatividade',
        description: 'Iniciativa e atitude proativa',
        cost: 4,
        icon: '🚀',
        color: '#FF4500' // Orange Red
      },
      {
        name: 'Resiliência',
        description: 'Superando desafios com atitude positiva',
        cost: 6,
        icon: '🏆',
        color: '#228B22' // Forest Green
      },
      {
        name: 'Conhecimento',
        description: 'Compartilhamento de conhecimento',
        cost: 5,
        icon: '📚',
        color: '#4B0082' // Indigo
      },
      {
        name: 'Cliente Primeiro',
        description: 'Foco na satisfação do cliente',
        cost: 7,
        icon: '🙏',
        color: '#B22222' // Fire Brick
      }
    ];
    
    await SuperCoinAttribute.insertMany(attributes);
    console.log(`${attributes.length} atributos de SuperCoin criados`);
  } catch (err) {
    console.error('Erro ao criar atributos de SuperCoin:', err);
  }
};

// Função para configurar o sistema de SuperCoin
const setupSuperCoinConfig = async () => {
  try {
    // Limpar configuração existente
    await SuperCoinConfig.deleteMany({});
    
    // Criar configuração padrão
    const config = new SuperCoinConfig({
      monthlyRechargeAmount: 100, // 100 moedas por mês
      rechargeDay: 1, // Primeiro dia do mês
      active: true
    });
    
    await config.save();
    console.log('Configuração de SuperCoin criada');
  } catch (err) {
    console.error('Erro ao criar configuração de SuperCoin:', err);
  }
};

// Função para criar saldos iniciais e transações
const seedSuperCoinData = async () => {
  try {
    // Limpar dados existentes
    await SuperCoinBalance.deleteMany({});
    await SuperCoinTransaction.deleteMany({});
    
    // Buscar usuários
    const users = await User.find({}).limit(20);
    if (!users.length) {
      console.log('Nenhum usuário encontrado. Verifique se existem usuários no banco de dados.');
      return;
    }
    
    // Buscar atributos
    const attributes = await SuperCoinAttribute.find({});
    if (!attributes.length) {
      console.log('Nenhum atributo encontrado. Execute seedSuperCoinAttributes primeiro.');
      return;
    }
    
    // Criar saldos para todos os usuários
    for (const user of users) {
      const balance = new SuperCoinBalance({
        userId: user._id,
        balance: 50 + Math.floor(Math.random() * 100), // Saldo aleatório entre 50-150
        totalReceived: 0,
        totalGiven: 0,
        lastRecharge: new Date()
      });
      
      await balance.save();
    }
    
    console.log(`${users.length} saldos de SuperCoin criados`);
    
    // Criar transações aleatórias
    const transactions = [];
    
    // Para cada usuário, criar algumas transações enviadas
    for (const sender of users) {
      // Número aleatório de transações (3-8)
      const transactionCount = 3 + Math.floor(Math.random() * 5);
      
      for (let i = 0; i < transactionCount; i++) {
        // Selecionar destinatário aleatório (diferente do remetente)
        let receiver;
        do {
          receiver = users[Math.floor(Math.random() * users.length)];
        } while (receiver._id.toString() === sender._id.toString());
        
        // Selecionar atributo aleatório
        const attribute = attributes[Math.floor(Math.random() * attributes.length)];
        
        // Criar transação
        const transaction = {
          fromUserId: sender._id,
          toUserId: receiver._id,
          amount: attribute.cost,
          attributeId: attribute._id,
          message: `Transação de teste para ${attribute.name}`,
          timestamp: randomDate(60)
        };
        
        transactions.push(transaction);
      }
    }
    
    // Inserir todas as transações
    await SuperCoinTransaction.insertMany(transactions);
    console.log(`${transactions.length} transações de SuperCoin criadas`);
    
    // Atualizar saldos com base nas transações
    for (const transaction of transactions) {
      // Atualizar saldo do remetente
      await SuperCoinBalance.updateOne(
        { userId: transaction.fromUserId },
        { 
          $inc: { 
            balance: -transaction.amount,
            totalGiven: transaction.amount
          }
        }
      );
      
      // Atualizar saldo do destinatário
      await SuperCoinBalance.updateOne(
        { userId: transaction.toUserId },
        {
          $inc: {
            balance: transaction.amount,
            totalReceived: transaction.amount
          }
        }
      );
    }
    
    console.log('Saldos de SuperCoin atualizados com base nas transações');
  } catch (err) {
    console.error('Erro ao criar dados de SuperCoin:', err);
  }
};

// Função principal para executar todas as seeds
const seedAll = async () => {
  try {
    await connectDB();
    
    await seedEngagementActions();
    await seedSuperCoinAttributes();
    await setupSuperCoinConfig();
    
    // Aguardar um momento para garantir que as ações e atributos estejam criados
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await seedEngagementRecords();
    await seedSuperCoinData();
    
    console.log('Processo de seed concluído com sucesso!');
    
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  } catch (err) {
    console.error('Erro durante o processo de seed:', err);
  }
};

// Executar o script
seedAll();