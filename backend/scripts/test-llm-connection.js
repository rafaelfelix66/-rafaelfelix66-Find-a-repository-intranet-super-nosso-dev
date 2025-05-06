// backend/scripts/test-llm-connection.js
const axios = require('axios');

const OLLAMA_BASE_URL = "http://172.19.0.27:11434";

async function testConnection() {
  console.log(`Testando conexão com servidor LLM em ${OLLAMA_BASE_URL}...`);
  
  try {
    // Testar chamada de API tags
    console.log('Testando endpoint /api/tags...');
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000
    });
    
    console.log('✅ Conexão bem-sucedida!');
    console.log('Resposta do servidor:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao servidor LLM:');
    
    if (error.response) {
      // O servidor respondeu com status de erro
      console.error(`Status: ${error.response.status}`);
      console.error('Resposta:', error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor. Verifique se:');
      console.error('1. O IP está correto (172.19.0.27)');
      console.error('2. A porta está correta (11434)');
      console.error('3. O servidor está online');
      console.error('4. Não há bloqueios de firewall');
    } else {
      // Erro na configuração da requisição
      console.error('Erro:', error.message);
    }
    
    return false;
  }
}

// Executar o teste
testConnection();