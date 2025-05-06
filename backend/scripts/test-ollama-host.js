const axios = require('axios');

async function testOllamaConnection() {
  const url = 'http://host.docker.internal:11434/api/tags';
  try {
    console.log(`Tentando conectar ao Ollama em ${url}...`);
    const response = await axios.get(url);
    console.log('Conexão bem-sucedida!');
    console.log('Modelos disponíveis:', response.data);
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao Ollama:');
    console.error('Mensagem de erro:', error.message);
    
    if (error.code) {
      console.error('Código de erro:', error.code);
    }
    
    if (error.response) {
      console.error('Status de resposta:', error.response.status);
      console.error('Dados da resposta:', error.response.data);
    } else if (error.request) {
      console.error('Nenhuma resposta recebida do servidor');
    }
    
    return false;
  }
}

testOllamaConnection();
