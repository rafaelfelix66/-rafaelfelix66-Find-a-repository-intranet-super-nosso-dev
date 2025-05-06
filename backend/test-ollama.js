const axios = require('axios');

async function testOllamaConnection() {
  try {
    console.log('Tentando conectar ao Ollama em http://172.19.0.27:11434...');
    const response = await axios.get('http://172.19.0.27:11434/api/tags');
    console.log('Conexão bem-sucedida!');
    console.log('Modelos disponíveis:', response.data);
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao Ollama:');
    console.error('Mensagem de erro:', error.message);
    
    // Informações mais detalhadas de erro
    if (error.code) {
      console.error('Código de erro:', error.code);
    }
    
    if (error.response) {
      // O servidor respondeu com um status fora do intervalo 2xx
      console.error('Status de resposta:', error.response.status);
      console.error('Dados da resposta:', error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Nenhuma resposta recebida do servidor');
    }
    
    return false;
  }
}

// Executar o teste
testOllamaConnection().then(success => {
  if (!success) {
    console.log('\nSugestões para resolução:');
    console.log('1. Verifique se o servidor Ollama está rodando em 172.19.0.27:11434');
    console.log('2. Verifique se há algum firewall bloqueando a conexão');
    console.log('3. Tente fazer ping no servidor: ping 172.19.0.27');
    console.log('4. Verifique se a rede Docker permite comunicação entre os contêineres');
  }
});
