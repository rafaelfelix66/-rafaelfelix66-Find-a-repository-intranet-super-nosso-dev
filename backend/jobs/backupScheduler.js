// jobs/backupScheduler.js
const cron = require('node-cron');
const { updateUserBackup } = require('../services/updateBackupService');

// Função para iniciar o agendamento
function startBackupScheduler() {
  console.log('Iniciando agendador de backup de usuários...');
  
  // Executar diariamente às 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('\n=== ATUALIZAÇÃO AUTOMÁTICA DO BACKUP ===');
    console.log(`Iniciada em: ${new Date().toLocaleString('pt-BR')}`);
    
    try {
      const result = await updateUserBackup();
      
      if (result.success) {
        console.log('✓ Backup atualizado automaticamente');
        console.log(`• ${result.newCount} novos usuários adicionados`);
      } else {
        console.error('✗ Erro na atualização automática:', result.error);
      }
    } catch (err) {
      console.error('Erro crítico na atualização automática:', err);
    }
    
    console.log('=====================================\n');
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  
  // Executar uma vez ao iniciar (opcional)
  console.log('Executando atualização inicial...');
  updateUserBackup().then(result => {
    if (result.success) {
      console.log(`✓ Atualização inicial completa: ${result.newCount} novos usuários`);
    } else {
      console.error('✗ Erro na atualização inicial:', result.error);
    }
  });
}

module.exports = { startBackupScheduler };