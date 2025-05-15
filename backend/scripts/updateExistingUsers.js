// scripts/updateExistingUsers.js
const mongoose = require('mongoose');
const { User } = require('../models');
const oracleService = require('../services/oracleService');
require('dotenv').config();

async function updateExistingUsers() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');
    
    // Buscar todos os usuários
    const users = await User.find({});
    console.log(`Encontrados ${users.length} usuários para atualizar`);
    
    let atualizados = 0;
    let erros = 0;
    
    for (const user of users) {
      try {
        if (!user.cpf) {
          console.log(`Usuário ${user.nome} não tem CPF, pulando...`);
          continue;
        }
        
        // Buscar dados no backup
        const dadosBackup = await oracleService.verificarCpfNoBackup(user.cpf);
        
        if (!dadosBackup.success) {
          console.log(`CPF ${user.cpf} não encontrado no backup`);
          continue;
        }
        
        const dadosUsuario = dadosBackup.data;
        
        // Atualizar campos do usuário
        user.nome = dadosUsuario.NOME || user.nome;
        user.chapa = dadosUsuario.CHAPA || user.chapa;
        user.cargo = dadosUsuario.FUNCAO || user.cargo;
        user.departamento = dadosUsuario.SETOR || user.departamento;
        user.filial = dadosUsuario.FILIAL || user.filial;
        
        if (dadosUsuario.DATAADMISSAO) {
          user.dataAdmissao = new Date(dadosUsuario.DATAADMISSAO);
        }
        
        if (dadosUsuario.DTNASCIMENTO) {
          user.dataNascimento = new Date(dadosUsuario.DTNASCIMENTO);
        }
        
        user.ultimaSincronizacao = new Date();
        
        await user.save();
        atualizados++;
        console.log(`✓ Usuário ${user.nome} atualizado com sucesso`);
        
      } catch (err) {
        console.error(`✗ Erro ao atualizar usuário ${user.nome}:`, err.message);
        erros++;
      }
    }
    
    console.log('\n=== RESUMO DA ATUALIZAÇÃO ===');
    console.log(`Total de usuários: ${users.length}`);
    console.log(`Atualizados com sucesso: ${atualizados}`);
    console.log(`Erros: ${erros}`);
    console.log(`Ignorados: ${users.length - atualizados - erros}`);
    
  } catch (error) {
    console.error('Erro geral:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
}

// Executar
if (require.main === module) {
  updateExistingUsers().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
}

module.exports = { updateExistingUsers };