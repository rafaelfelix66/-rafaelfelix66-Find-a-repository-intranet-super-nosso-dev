// backend/scripts/addMissingEngagementActions.js (CORRIGIDO)

const mongoose = require('mongoose');
const { EngagementAction } = require('../models/Engagement');
require('dotenv').config();

async function addMissingActions() {
  try {
    // CORREÇÃO: Usar localhost em vez de mongodb
    const mongoUri = process.env.MONGODB_URI?.replace('mongodb:27017', 'localhost:27017') 
                    || 'mongodb://admin:senhasegura123@localhost:27017/intranet?authSource=admin';
    
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB');
    
    // Apenas as 2 ações que estão faltando
    const missingActions = [
      {
        actionType: 'comment_like',
        displayName: 'Curtir Comentário',
        points: 1,
        description: 'Curtir um comentário em uma publicação',
        active: true
      },
      {
        actionType: 'post_react',
        displayName: 'Reagir com Emoji',
        points: 2,
        description: 'Reagir com emoji a uma publicação',
        active: true
      }
    ];
    
    let addedCount = 0;
    
    for (const action of missingActions) {
      // Verificar se já existe
      const existing = await EngagementAction.findOne({ actionType: action.actionType });
      
      if (!existing) {
        await EngagementAction.create(action);
        console.log(`✅ Ação '${action.actionType}' adicionada com sucesso`);
        addedCount++;
      } else {
        console.log(`⚠️  Ação '${action.actionType}' já existe, pulando...`);
      }
    }
    
    console.log(`\n🎯 Resumo: ${addedCount} novas ações adicionadas`);
    console.log('✅ Sistema de engajamento atualizado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar ações:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

if (require.main === module) {
  addMissingActions();
}

module.exports = { addMissingActions };