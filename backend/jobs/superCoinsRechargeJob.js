// backend/jobs/superCoinsRechargeJob.js
const cron = require('node-cron');
const mongoose = require('mongoose');
const { User } = require('../models');
const { SuperCoinBalance, SuperCoinConfig } = require('../models/SuperCoin');

/**
 * Job para recarga mensal de Super Coins
 * Executa no primeiro dia de cada mês às 00:01
 */
function scheduleSuperCoinsRecharge() {
  console.log('Agendando job de recarga mensal de Super Coins...');
  
  // Executa às 00:01 do primeiro dia de cada mês
  cron.schedule('1 0 1 * *', async () => {
    console.log(`Iniciando recarga mensal de Super Coins: ${new Date().toISOString()}`);
    await performMonthlyRecharge();
  });
  
  // Também agendando para rodar 1 minuto após o servidor iniciar (para testes)
  setTimeout(async () => {
    console.log('Verificando necessidade de recarga...');
    const config = await SuperCoinConfig.findOne({ active: true });
    
    if (!config) {
      console.log('Configuração não encontrada. Criando configuração padrão...');
      const defaultConfig = new SuperCoinConfig();
      await defaultConfig.save();
      console.log('Configuração padrão criada');
    } else {
      const today = new Date();
      // Executar se for o dia configurado para recarga
      if (today.getDate() === config.rechargeDay) {
        console.log(`Hoje é dia ${today.getDate()}, que corresponde ao dia de recarga configurado (${config.rechargeDay})`);
        console.log('Executando recarga inicial de Super Coins');
        await performMonthlyRecharge();
      } else {
        console.log(`Hoje é dia ${today.getDate()}, mas o dia de recarga é ${config.rechargeDay}. Pulando recarga.`);
      }
    }
  }, 60000);
  
  console.log('Job de recarga mensal de Super Coins agendado com sucesso');
}

/**
 * Executa a recarga mensal de moedas para todos os usuários
 */
async function performMonthlyRecharge() {
  try {
    console.log('Iniciando recarga mensal...');
    
    // Buscar configuração ativa
    const config = await SuperCoinConfig.findOne({ active: true });
    if (!config) {
      console.error('Nenhuma configuração ativa encontrada');
      return;
    }
    
    const { monthlyRechargeAmount, rechargeMode } = config;
    
    console.log(`Configuração encontrada: ${monthlyRechargeAmount} coins, modo: ${rechargeMode}`);
    
    // Buscar todos os usuários ativos
    const users = await User.find({ ativo: true });
    console.log(`Encontrados ${users.length} usuários ativos`);
    
    let rechargedUsers = 0;
    let skippedUsers = 0;
    let totalCoinsAdded = 0;
    
    // Para cada usuário, realizar a recarga
    for (const user of users) {
      try {
        // Buscar ou criar saldo do usuário
        let balance = await SuperCoinBalance.findOne({ userId: user._id });
        if (!balance) {
          balance = new SuperCoinBalance({ 
            userId: user._id, 
            balance: 0,
            totalReceived: 0,
            totalGiven: 0,
            lastRecharge: null
          });
        }
        
        // Verificar se já foi recarregado este mês
        const lastRecharge = balance.lastRecharge;
        const now = new Date();
        
        if (
          lastRecharge &&
          lastRecharge.getMonth() === now.getMonth() &&
          lastRecharge.getFullYear() === now.getFullYear()
        ) {
          console.log(`Usuário ${user.nome} já recebeu recarga este mês. Pulando...`);
          skippedUsers++;
          continue; // Já foi recarregado este mês
        }
        
        // Calcular a quantidade de moedas a adicionar
        let coinsToAdd = monthlyRechargeAmount;
        
        // Se o modo for complementar, calcula apenas a diferença
        if (rechargeMode === 'complement' && balance.balance >= monthlyRechargeAmount) {
          console.log(`Usuário ${user.nome} já tem saldo suficiente (${balance.balance}). Pulando...`);
          skippedUsers++;
          continue;
        } else if (rechargeMode === 'complement') {
          coinsToAdd = monthlyRechargeAmount - balance.balance;
        }
        
        // Atualizar saldo
        if (coinsToAdd > 0) {
          balance.balance += coinsToAdd;
          balance.totalReceived += coinsToAdd;
          balance.lastRecharge = now;
          await balance.save();
          
          rechargedUsers++;
          totalCoinsAdded += coinsToAdd;
          
          console.log(`Recarga para ${user.nome}: +${coinsToAdd} coins. Novo saldo: ${balance.balance}`);
        } else {
          skippedUsers++;
        }
      } catch (userError) {
        console.error(`Erro na recarga para usuário ${user.nome}:`, userError);
      }
    }
    
    console.log(`Recarga mensal concluída. Estatísticas:`);
    console.log(`- Usuários recarregados: ${rechargedUsers}`);
    console.log(`- Usuários pulados: ${skippedUsers}`);
    console.log(`- Total de moedas adicionadas: ${totalCoinsAdded}`);
    
  } catch (error) {
    console.error('Erro na recarga mensal:', error);
  }
}

// Função para executar recarga manualmente via API
const manualRecharge = async () => {
  try {
    console.log('Iniciando recarga manual de Super Coins...');
    await performMonthlyRecharge();
    return { success: true, message: 'Recarga manual concluída com sucesso' };
  } catch (error) {
    console.error('Erro na recarga manual:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  scheduleSuperCoinsRecharge,
  performMonthlyRecharge,
  manualRecharge
};