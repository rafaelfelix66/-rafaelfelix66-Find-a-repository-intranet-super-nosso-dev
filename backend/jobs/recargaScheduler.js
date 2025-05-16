// jobs/recargaScheduler.js
// Adicionar job scheduler para recarga mensal
const { monthlyRecharge } = require('./controllers/superCoinController');
const cron = require('node-cron');

// Executar todos os dias à meia-noite para verificar recarga
cron.schedule('0 0 * * *', () => {
  console.log('Verificando recarga mensal de Super Coins...');
  monthlyRecharge();
});