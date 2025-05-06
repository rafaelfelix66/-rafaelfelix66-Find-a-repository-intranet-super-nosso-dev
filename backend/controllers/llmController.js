// controllers/llmController.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { File } = require('../models');

// Configuração do Ollama LLM
const OLLAMA_BASE_URL = "http://host.docker.internal:11434";
const OLLAMA_MODEL = "deepseek-v2-q8";
const OLLAMA_TEMPERATURE = 0.5;
const OLLAMA_NUM_CTX = 2048;
const OLLAMA_TOP_K = 50;
const STOP_TOKENS = ["|<|assistant|>", "|<|user|>", "|<|system|>"];

// Para debug - adicionamos um log ao iniciar
console.log(`LLM Controller inicializado com OLLAMA_BASE_URL: ${OLLAMA_BASE_URL}`);

// Configuração de caminhos para arquivos
const BASE_UPLOAD_PATH = process.env.NODE_ENV === 'production' 
  ? '/uploads/files'
  : 'C:\\intranet-super-nosso\\uploads\\files';

// Função para resolver o caminho do arquivo
const resolveFilePath = (filePath) => {
  // Se o caminho já estiver no formato absoluto correto
  if (filePath.startsWith(BASE_UPLOAD_PATH)) {
    return filePath;
  }
  
  // Se o caminho relativo estiver armazenado no objeto File
  if (filePath.startsWith('/uploads/files/')) {
    return filePath.replace('/uploads/files/', BASE_UPLOAD_PATH + '/');
  }
  
  // Se o caminho for relativo ao diretório do servidor
  if (filePath.includes('uploads/files/')) {
    const relativePath = filePath.substring(filePath.indexOf('uploads/files/') + 'uploads/files/'.length);
    return path.join(BASE_UPLOAD_PATH, relativePath);
  }
  
  // Caso padrão, apenas retorna o caminho original
  return filePath;
};

// Função para extrair texto de diferentes tipos de arquivo
const extractTextFromFile = async (filePath, mimeType, extension) => {
  try {
    // Para arquivos de texto, leitura direta
    if (mimeType?.startsWith('text/') || 
        ['txt', 'md', 'json', 'csv', 'xml', 'html', 'css', 'js'].includes(extension?.toLowerCase())) {
      return fs.readFileSync(filePath, 'utf8').substring(0, 10000);
    }
    
    // Para PDFs, seria ideal ter uma biblioteca como pdf.js
    // Aqui estamos apenas simulando uma extração simples
    if (mimeType === 'application/pdf' || extension?.toLowerCase() === 'pdf') {
      // Simulação - em um cenário real, usaríamos uma biblioteca adequada
      return `[Conteúdo extraído do PDF: ${path.basename(filePath)}]`;
    }
    
    // Para documentos Word/Office, seria necessário uma biblioteca específica
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension?.toLowerCase()) ||
        mimeType?.includes('officedocument')) {
      // Simulação - em um cenário real, usaríamos uma biblioteca adequada
      return `[Conteúdo extraído do documento Office: ${path.basename(filePath)}]`;
    }
    
    // Para outros tipos, retornar informação básica
    return `[Este arquivo é do tipo ${mimeType || extension} e não foi possível extrair texto diretamente]`;
  } catch (error) {
    console.error(`Erro ao extrair texto do arquivo ${filePath}:`, error.message);
    return null;
  }
};

// Função para gerar embedding de um texto
const generateEmbedding = async (text) => {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/embeddings`, {
      model: OLLAMA_MODEL,
      prompt: text,
    });
    
    if (response.data && response.data.embedding) {
      return response.data.embedding;
    }
    
    throw new Error('Falha ao gerar embedding: resposta inválida');
  } catch (error) {
    console.error('Erro ao gerar embedding:', error.message);
    throw error;
  }
};

// Função para calcular similaridade de cosseno entre dois vetores
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Função para buscar arquivos relevantes à consulta
const findRelevantDocuments = async (query, userId) => {
  try {
    // Gerar embedding para a consulta
    const queryEmbedding = await generateEmbedding(query);
    
    // Obter arquivos do usuário
    const userFiles = await File.find({
      $or: [
        { owner: userId },
        { 'sharedWith.user': userId },
        { isPublic: true }
      ]
    });
    
    // Filtrar por tipos de arquivo de texto
    const textFiles = userFiles.filter(file => {
      const mimeType = file.mimeType.toLowerCase();
      const extension = file.extension?.toLowerCase() || '';
      
      return mimeType.includes('text') || 
             ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md', 'json', 'csv'].includes(extension);
    });
    
    // Processar cada arquivo para calcular similaridade
    const fileContentsPromises = textFiles.map(async (file) => {
      try {
        // Ler o conteúdo do arquivo
        const filePath = file.path;
        if (!fs.existsSync(filePath)) {
          console.warn(`Arquivo não encontrado: ${filePath}`);
          return null;
        }
        
        // Limitar a leitura a primeiros 10000 caracteres para arquivos grandes
        const fileContent = await extractTextFromFile(
		  filePath,
		  file.mimeType,
		  file.extension
		);
        const fileEmbedding = await generateEmbedding(fileContent);
        
        // Calcular similaridade
        const similarity = cosineSimilarity(queryEmbedding, fileEmbedding);
        
        return {
          file,
          content: fileContent,
          similarity
        };
      } catch (error) {
        console.error(`Erro ao processar arquivo ${file.name}:`, error.message);
        return null;
      }
    });
    
    // Resolver todas as promessas
    const fileContents = (await Promise.all(fileContentsPromises))
      .filter(item => item !== null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Obter os 5 mais relevantes
    
    return fileContents;
  } catch (error) {
    console.error('Erro ao buscar documentos relevantes:', error.message);
    return [];
  }
};

// Função para obter resposta do LLM baseada em contexto
const getResponseWithContext = async (query, context) => {
  try {
    // Construir o prompt com contexto
    const systemPrompt = "Você é um assistente da Intranet Super Nosso que responde perguntas com base nos documentos disponíveis. Seja claro, objetivo e útil.";
    
    // Adicionar contexto extraído dos documentos
    const contextPrompt = context.length > 0 
      ? `Contexto extraído dos documentos:\n\n${context.join('\n\n')}\n\nResponda com base no contexto acima.`
      : "Não foram encontrados documentos relevantes para esta consulta. Por favor, responda com seu conhecimento geral.";
    
    // Montar o prompt final
    const prompt = `${systemPrompt}\n\n${contextPrompt}\n\nPergunta: ${query}\n\nResposta:`;
    
	console.log(`Enviando prompt para o LLM (${prompt.length} caracteres)`);
	
    // Enviar para o Ollama
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      temperature: OLLAMA_TEMPERATURE,
      num_ctx: OLLAMA_NUM_CTX,
      top_k: OLLAMA_TOP_K,
      stop: STOP_TOKENS,
	  stream: false // Desabilitar streaming explicitamente
    }, {
      timeout: 600000 // Aumentar para 60 segundos
    });
	
	console.log('Resposta recebida do LLM, status:', response.status);
    
    // Processar a resposta não-streaming
    if (response.data && response.data.response) {
      return response.data.response;
    }
    
    // Alternativa: processar respostas em formato streaming
    // Se a resposta vier como uma string contendo múltiplos JSONs
    if (typeof response.data === 'string' && response.data.includes('{"model"')) {
      try {
        // Extrair todas as partes da resposta em streaming
        const lines = response.data.split('\n')
          .filter(line => line.trim() !== '');
          
        let fullResponse = '';
        
        // Processar cada linha como um objeto JSON separado
        for (const line of lines) {
          try {
            const chunk = JSON.parse(line);
            if (chunk.response) {
              fullResponse += chunk.response;
            }
            // Se for a última parte e estiver marcada como done
            if (chunk.done === true) {
              console.log('Resposta completa recebida.');
            }
          } catch (e) {
            console.warn('Erro ao processar chunk de resposta:', e.message);
          }
        }
        
        if (fullResponse) {
          console.log(`Resposta LLM reconstruída: ${fullResponse.substring(0, 50)}...`);
          return fullResponse;
        }
      } catch (e) {
        console.error('Erro ao processar resposta em formato streaming:', e);
      }
    }
    
    // Log detalhado da estrutura da resposta
    console.error('Estrutura da resposta do LLM inesperada:', 
      typeof response.data === 'string' 
        ? response.data.substring(0, 500) + '...'
        : JSON.stringify(response.data));
    
    throw new Error('Resposta inválida do modelo LLM: formato inesperado');
    
  } catch (error) {
    console.error('Erro detalhado ao obter resposta do LLM:', error);
    
    if (error.response) {
      // O servidor respondeu com um código de erro
      console.error('Status do erro:', error.response.status);
      console.error('Resposta de erro:', error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor LLM');
    }
    
    throw error;
  }
};





// Verificar se o LLM está disponível
const checkLLMStatus = async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`);
    
    if (response.status === 200) {
      const models = response.data.models || [];
      const hasModel = models.some(model => model.name.includes(OLLAMA_MODEL));
      
      res.json({
        status: 'online',
        model: OLLAMA_MODEL,
        modelAvailable: hasModel
      });
    } else {
      res.status(503).json({ status: 'offline', message: 'Serviço Ollama indisponível' });
    }
  } catch (error) {
    console.error('Erro ao verificar status do LLM:', error.message);
    res.status(503).json({ status: 'offline', message: 'Serviço Ollama indisponível' });
  }
};

// Enviar mensagem para o LLM com RAG
const sendMessage = async (req, res) => {
  try {
	   // Log detalhado do que está sendo recebido
    console.log('Requisição LLM recebida:');
    console.log('- Body:', JSON.stringify(req.body));
    console.log('- Message:', req.body.message);
    console.log('- History:', req.body.conversationHistory ? 
                 `${req.body.conversationHistory.length} mensagens` : 'undefined');
	  
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ mensagem: 'Mensagem não fornecida' });
    }
    
    // Buscar documentos relevantes à consulta
    const relevantDocs = await findRelevantDocuments(message, req.usuario.id);
    
    // Extrair contexto dos documentos
    const context = relevantDocs.map(doc => 
      `Documento: ${doc.file.name}\nConteúdo: ${doc.content.substring(0, 1000)}`
    );
    
    // Obter resposta do LLM
    const llmResponse = await getResponseWithContext(message, context);
    
    // Salvar informações dos documentos usados
    const usedDocuments = relevantDocs.map(doc => ({
      id: doc.file._id,
      name: doc.file.name,
      similarity: doc.similarity
    }));
    
    res.json({
      message: llmResponse,
      sources: usedDocuments
    });
  } catch (error) {
    console.error('Erro ao processar mensagem:', error.message);
    res.status(500).json({ mensagem: 'Erro ao processar mensagem', error: error.message });
  }
};

module.exports = {
  checkLLMStatus,
  sendMessage
};