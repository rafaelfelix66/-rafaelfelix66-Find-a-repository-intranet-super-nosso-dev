// controllers/llmController.js - Versão aprimorada
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { File } = require('../models');


// Configuração do Ollama LLM
const OLLAMA_BASE_URL = "http://host.docker.internal:11434";
const OLLAMA_MODEL = "deepseek-v2-q8";
const OLLAMA_TEMPERATURE = 0.5;
const OLLAMA_NUM_CTX = 2048;
const OLLAMA_TOP_K = 50;
const STOP_TOKENS = ["|<|assistant|>", "|<|user|>", "|<|system|>"];

// Configuração de caminhos para arquivos
const BASE_UPLOAD_PATH = process.env.NODE_ENV === 'production' 
  ? '/uploads/files'
  : 'C:\\intranet-super-nosso\\uploads\\files';

// Para debug - adicionamos um log ao iniciar
console.log(`LLM Controller inicializado com OLLAMA_BASE_URL: ${OLLAMA_BASE_URL}`);
console.log(`BASE_UPLOAD_PATH configurado para: ${BASE_UPLOAD_PATH}`);

// Verificar existência do diretório
if (!fs.existsSync(BASE_UPLOAD_PATH)) {
  console.warn(`Diretório BASE_UPLOAD_PATH não encontrado: ${BASE_UPLOAD_PATH}`);
  try {
    fs.mkdirSync(BASE_UPLOAD_PATH, { recursive: true });
    console.log(`Diretório BASE_UPLOAD_PATH criado: ${BASE_UPLOAD_PATH}`);
  } catch (err) {
    console.error(`Erro ao criar diretório: ${err.message}`);
  }
}

// Função melhorada para resolver o caminho do arquivo
const resolveFilePath = (filePath) => {
  if (!filePath) {
    console.log('resolveFilePath: Caminho vazio');
    return null;
  }
  
  console.log(`resolveFilePath: Tentando resolver ${filePath}`);
  
  // Se o caminho já estiver no formato absoluto correto
  if (filePath.startsWith(BASE_UPLOAD_PATH)) {
    console.log(`resolveFilePath: Já é um caminho absoluto`);
    return filePath;
  }
  
  // Tentar vários formatos de caminhos possíveis
  const possiblePaths = [
    filePath,
    path.join(BASE_UPLOAD_PATH, path.basename(filePath)),
    filePath.replace('/uploads/files/', BASE_UPLOAD_PATH + path.sep),
    path.join(process.cwd(), filePath),
    path.resolve(filePath)
  ];
  
  for (const testPath of possiblePaths) {
    console.log(`resolveFilePath: Testando ${testPath}`);
    if (fs.existsSync(testPath)) {
      console.log(`resolveFilePath: Caminho encontrado: ${testPath}`);
      return testPath;
    }
  }
  
  // Caso padrão, apenas retorna o caminho original
  console.log(`resolveFilePath: Nenhum caminho válido encontrado, retornando original`);
  return filePath;
};
// Função recursiva para listar todos os arquivos em um diretório
const getAllFiles = (dir, fileList = []) => {
  try {
    if (!fs.existsSync(dir)) {
      console.warn(`Diretório não existe: ${dir}`);
      return fileList;
    }
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      
      if (fs.statSync(filePath).isDirectory()) {
        // Recursivamente buscar em subdiretórios
        fileList = getAllFiles(filePath, fileList);
      } else {
        // Filtrar apenas pelos tipos relevantes
        const ext = path.extname(filePath).toLowerCase().substring(1);
        if (['txt', 'pdf', 'md', 'doc', 'docx', 'csv', 'json', 'xml'].includes(ext)) {
          fileList.push({
            path: filePath,
            name: file,
            extension: ext
          });
        }
      }
    });
    
    return fileList;
  } catch (error) {
    console.error(`Erro ao listar arquivos em ${dir}:`, error.message);
    return fileList;
  }
};

// Função para extrair texto de diferentes tipos de arquivo
const extractTextFromFile = async (filePath, mimeType, extension) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Arquivo não existe: ${filePath}`);
      return null;
    }

    console.log(`Extraindo texto de ${filePath} (${mimeType || extension || 'desconhecido'})`);
    
    // Para arquivos de texto, leitura direta
    if (mimeType?.startsWith('text/') || 
        ['txt', 'md', 'json', 'csv', 'xml', 'html', 'css', 'js'].includes(extension?.toLowerCase())) {
      return fs.readFileSync(filePath, 'utf8').substring(0, 10000);
    }
    
    // Para PDFs, seria ideal ter uma biblioteca como pdf.js
    if (mimeType === 'application/pdf' || extension?.toLowerCase() === 'pdf') {
	  try {
		// Ler o arquivo PDF como um buffer
		const dataBuffer = fs.readFileSync(filePath);
		// Extrair texto do PDF
		const pdfData = await pdfParse(dataBuffer);
		// Retornar o texto extraído, limitado a 10000 caracteres
		return pdfData.text.substring(0, 10000);
	  } catch (pdfError) {
		console.error(`Erro ao extrair texto do PDF ${filePath}:`, pdfError.message);
		return `[Não foi possível extrair o conteúdo do PDF: ${path.basename(filePath)}]`;
	  }
	}
    
    // Para documentos Word/Office
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
    if (!text) {
      console.warn('Texto vazio para geração de embedding');
      return null;
    }
    
    // Limitar tamanho do texto para evitar erros
    const truncatedText = text.substring(0, 4000);
    
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/embeddings`, {
      model: OLLAMA_MODEL,
      prompt: truncatedText,
    });
    
    if (response.data && response.data.embedding) {
      return response.data.embedding;
    }
    
    throw new Error('Falha ao gerar embedding: resposta inválida');
  } catch (error) {
    console.error('Erro ao gerar embedding:', error.message);
    return null;  // Retornar null em vez de propagar o erro
  }
};

// Função para calcular similaridade de cosseno entre dois vetores
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Função aprimorada para buscar documentos relevantes
const findRelevantDocuments = async (query, userId) => {
  try {
    console.log(`Buscando documentos relevantes para: "${query}"`);
	console.log(`BASE_UPLOAD_PATH: ${BASE_UPLOAD_PATH}`);
	console.log(`Verificando diretório: ${fs.existsSync(BASE_UPLOAD_PATH) ? 'Existe' : 'Não existe'}`);
if (fs.existsSync(BASE_UPLOAD_PATH)) {
  try {
    const files = fs.readdirSync(BASE_UPLOAD_PATH);
    console.log(`Arquivos no diretório: ${files.join(', ')}`);
  } catch (err) {
    console.error(`Erro ao listar arquivos: ${err.message}`);
  }
}
    
    // Gerar embedding para a consulta
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) {
      console.error("Falha ao gerar embedding para a consulta");
      return [];
    }
    
    // Lista combinada de documentos
    const allDocuments = [];
    const processedPaths = new Set();  // Para evitar duplicatas
    
    // PARTE 1: Buscar arquivos do banco de dados MongoDB
    try {
      console.log("Buscando arquivos do banco de dados...");
      const userFiles = await File.find({
        $or: [
          { owner: userId },
          { 'sharedWith.user': userId },
          { isPublic: true }
        ]
      });
      
      console.log(`Encontrados ${userFiles.length} arquivos no banco de dados`);
      
      // Processar arquivos do banco
      for (const file of userFiles) {
        try {
          const filePath = resolveFilePath(file.path);
          
          if (!filePath || processedPaths.has(filePath)) continue;
          processedPaths.add(filePath);
          
          if (!fs.existsSync(filePath)) {
            console.warn(`Arquivo não encontrado: ${filePath}`);
            continue;
          }
          
          // Ler conteúdo e calcular similaridade
          const content = await extractTextFromFile(
            filePath,
            file.mimeType,
            file.extension
          );
          
          if (!content) continue;
          
          const fileEmbedding = await generateEmbedding(content);
          if (!fileEmbedding) continue;
          
          const similarity = cosineSimilarity(queryEmbedding, fileEmbedding);
          
          allDocuments.push({
            file: {
              id: file._id.toString(),
              name: file.name || path.basename(filePath),
              path: filePath,
              mimeType: file.mimeType,
              extension: file.extension
            },
            content,
            similarity
          });
          
        } catch (error) {
          console.error(`Erro ao processar arquivo do banco ${file.name || file.path}:`, error.message);
        }
      }
    } catch (dbError) {
      console.error("Erro ao buscar arquivos do banco de dados:", dbError.message);
    }
    
    // PARTE 2: Buscar todos os arquivos do diretório
    try {
      console.log(`Buscando arquivos do diretório: ${BASE_UPLOAD_PATH}`);
      const filesFromDir = getAllFiles(BASE_UPLOAD_PATH);
      console.log(`Encontrados ${filesFromDir.length} arquivos no diretório`);
      
      for (const file of filesFromDir) {
        try {
          if (processedPaths.has(file.path)) continue;
          processedPaths.add(file.path);
          
          // Ler conteúdo e calcular similaridade
          const content = await extractTextFromFile(
            file.path,
            null,  // Não temos mimeType
            file.extension
          );
          
          if (!content) continue;
          
          const fileEmbedding = await generateEmbedding(content);
          if (!fileEmbedding) continue;
          
          const similarity = cosineSimilarity(queryEmbedding, fileEmbedding);
          
          allDocuments.push({
            file: {
              id: path.basename(file.path),  // Usar nome do arquivo como ID
              name: file.name,
              path: file.path,
              extension: file.extension
            },
            content,
            similarity
          });
          
        } catch (error) {
          console.error(`Erro ao processar arquivo do diretório ${file.path}:`, error.message);
        }
      }
    } catch (fsError) {
      console.error("Erro ao buscar arquivos do diretório:", fsError.message);
    }
    
    // Ordenar por similaridade e obter os mais relevantes
    const relevantDocuments = allDocuments
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);  // Top 5 mais relevantes
    
    console.log(`Selecionados ${relevantDocuments.length} documentos mais relevantes`);
    relevantDocuments.forEach((doc, idx) => {
      console.log(`Doc ${idx+1}: ${doc.file.name} (Similaridade: ${doc.similarity.toFixed(4)})`);
    });
    
    return relevantDocuments;
  } catch (error) {
    console.error('Erro geral ao buscar documentos relevantes:', error.message);
    return [];
  }
};

// Função aprimorada para obter resposta do LLM com contexto
const getResponseWithContext = async (query, documents) => {
  try {
    // Construir o prompt com contexto melhorado
    const systemPrompt = "Você é um assistente da Intranet Super Nosso que responde perguntas com base nos documentos disponíveis. Seja claro, objetivo e útil.";
    
    let contextPrompt = "";
    let documentIds = [];
    
    if (documents && documents.length > 0) {
      contextPrompt = "Contexto extraído dos documentos:\n\n";
      
      documents.forEach((doc, index) => {
        // Adicionar documento numerado ao contexto
        contextPrompt += `=== DOCUMENTO ${index + 1}: ${doc.file.name} ===\n${doc.content}\n\n`;
        documentIds.push({
          id: doc.file.id,
          name: doc.file.name,
          index: index + 1
        });
      });
      
      // Instruções específicas para identificar a fonte 
      contextPrompt += "INSTRUÇÕES IMPORTANTES: Ao responder, indique explicitamente de qual documento (pelo número e nome) você obteve cada informação. " +
                      "Se você usar múltiplos documentos, cite cada um deles quando usar sua informação. " +
                      "Responda com base APENAS nos documentos fornecidos acima.";
    } else {
      contextPrompt = "Não foram encontrados documentos relevantes para esta consulta. Por favor, responda com seu conhecimento geral.";
    }
    
    // Montar o prompt final
    const prompt = `${systemPrompt}\n\n${contextPrompt}\n\nPergunta: ${query}\n\nResposta:`;
    
    console.log(`Enviando prompt para o LLM (${prompt.length} caracteres)`);
    
    // Fazer requisição para o Ollama
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      temperature: OLLAMA_TEMPERATURE,
      num_ctx: OLLAMA_NUM_CTX,
      top_k: OLLAMA_TOP_K,
      stop: STOP_TOKENS,
      stream: false  // Desabilitar streaming para simplicidade
    }, {
      timeout: 600000  // 10 minutos
    });
    
    if (!response.data || !response.data.response) {
      throw new Error('Resposta inválida do LLM');
    }
    
    const llmResponse = response.data.response;
    
    // Identificar quais documentos foram efetivamente utilizados na resposta
    const usedDocuments = [];
    if (documentIds.length > 0) {
      for (const doc of documentIds) {
        // Procurar menções explícitas ao documento
        const docMentionPatterns = [
          `DOCUMENTO ${doc.index}`,
          `Documento ${doc.index}`,
          `documento ${doc.index}`,
          doc.name
        ];
        
        if (docMentionPatterns.some(pattern => llmResponse.includes(pattern))) {
          usedDocuments.push({
            id: doc.id,
            name: doc.name
          });
        }
      }
      
      // Se não encontrou nenhuma menção explícita, usar apenas o documento mais relevante
      if (usedDocuments.length === 0 && documents.length > 0) {
        const mostRelevantDoc = documents[0];
        usedDocuments.push({
          id: mostRelevantDoc.file.id,
          name: mostRelevantDoc.file.name,
          similarity: mostRelevantDoc.similarity
        });
      }
    }
    
    return {
      response: llmResponse,
      usedDocuments: usedDocuments
    };
    
  } catch (error) {
    console.error('Erro ao obter resposta do LLM:', error);
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

// Função principal melhorada: enviar mensagem para o LLM com RAG
const sendMessage = async (req, res) => {
  try {
    console.log('Requisição LLM recebida:', req.body.message);
    
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ mensagem: 'Mensagem não fornecida' });
    }
    
    // 1. BUSCAR DOCUMENTOS RELEVANTES
    const relevantDocs = await findRelevantDocuments(message, req.usuario.id);
    console.log(`Encontrados ${relevantDocs.length} documentos relevantes`);
    
    // 2. OBTER RESPOSTA DO LLM COM IDENTIFICAÇÃO DE DOCUMENTOS USADOS
    const { response: llmResponse, usedDocuments } = await getResponseWithContext(message, relevantDocs);
    
    // 3. RETORNAR RESPOSTA COM APENAS OS DOCUMENTOS USADOS COMO FONTE
    res.json({
      message: llmResponse,
      sources: usedDocuments
    });
    
  } catch (error) {
    console.error('Erro ao processar mensagem:', error.message);
    res.status(500).json({ mensagem: 'Erro ao processar mensagem', error: error.message });
  }
};

// Função alternativa com suporte a streaming
const sendMessageStreaming = async (req, res) => {
  try {
    // Log detalhado do que está sendo recebido
    console.log('Requisição LLM recebida:');
    console.log('- Message:', req.body.message);
    
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ mensagem: 'Mensagem não fornecida' });
    }
    
    // Buscar documentos relevantes à consulta
    const relevantDocs = await findRelevantDocuments(message, req.usuario.id);
    
    // Configurar cabeçalhos para streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Para Nginx
    
    // IMPORTANTE: Aqui enviamos apenas os documentos que serão efetivamente utilizados
    // (vamos determinar isso após a resposta do LLM)
    
    // Construir o prompt com contexto numerado
    const systemPrompt = "Você é um assistente da Intranet Super Nosso que responde perguntas com base nos documentos disponíveis. Seja claro, objetivo e útil.";
    
    let contextPrompt = "";
    let documentIds = [];
    
    if (relevantDocs.length > 0) {
      contextPrompt = "Contexto extraído dos documentos:\n\n";
      
      relevantDocs.forEach((doc, index) => {
        contextPrompt += `=== DOCUMENTO ${index + 1}: ${doc.file.name} ===\n${doc.content}\n\n`;
        documentIds.push({
          id: doc.file.id,
          name: doc.file.name,
          index: index + 1
        });
      });
      
      contextPrompt += "INSTRUÇÕES MUITO IMPORTANTES: \n";
	  contextPrompt += "1. Você DEVE citar explicitamente qual documento (número e nome) foi usado para cada parte da sua resposta\n";
	  contextPrompt += "2. Comece sua resposta com 'De acordo com os documentos fornecidos, ...' e cite cada fonte usada\n";
	  contextPrompt += "3. Se você não encontrar a informação nos documentos, informe claramente\n";
	  contextPrompt += "4. NUNCA invente informações que não estejam nos documentos\n";
    } else {
      contextPrompt = "Não foram encontrados documentos relevantes para esta consulta. Por favor, responda com seu conhecimento geral.";
    }
    
    const prompt = `${systemPrompt}\n\n${contextPrompt}\n\nPergunta: ${message}\n\nResposta:`;
    
    console.log(`Enviando prompt para o LLM (${prompt.length} caracteres)`);
    
    // Fazer requisição para o Ollama com streaming
    const response = await axios({
      method: 'post',
      url: `${OLLAMA_BASE_URL}/api/generate`,
      data: {
        model: OLLAMA_MODEL,
        prompt: prompt,
        temperature: OLLAMA_TEMPERATURE,
        num_ctx: OLLAMA_NUM_CTX,
        top_k: OLLAMA_TOP_K,
        stop: STOP_TOKENS,
        stream: true
      },
      responseType: 'stream',
      timeout: 600000 // 10 minutos
    });
    
    // Buffer para acumular a resposta completa
    let completeResponse = '';
    
    // Processar o stream de resposta
    response.data.on('data', (chunk) => {
      const chunkStr = chunk.toString('utf8');
      
      // Processar cada linha
      const lines = chunkStr.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          // Acumular a resposta completa
          if (data.response) {
            completeResponse += data.response;
          }
          
          // Enviar cada parte da resposta para o cliente
          if (data.response) {
            res.write(`data: ${JSON.stringify({
              type: 'token',
              content: data.response
            })}\n\n`);
          }
          
          // Se for o final da resposta
          if (data.done) {
            // Analisar a resposta para identificar documentos utilizados
            const usedDocuments = [];
            
            // Verificar cada documento mencionado na resposta
            for (const doc of documentIds) {
			  if (docMentionPatterns.some(pattern => completeResponse.includes(pattern))) {
				usedDocuments.push({
				  id: doc.id,
				  name: doc.name
				});
			  }
			}
            
            // Garantir que pelo menos um documento seja citado
			if (usedDocuments.length === 0 && relevantDocs.length > 0) {
			  console.log('Nenhum documento foi mencionado explicitamente na resposta');
			  const topDoc = relevantDocs[0];
			  usedDocuments.push({
				id: topDoc.file.id,
				name: topDoc.file.name,
				similarity: topDoc.similarity,
				note: 'Documento mais relevante (inferido)'
			  });
			}

			// Enviar metadados com os documentos utilizados
			res.write(`data: ${JSON.stringify({
			  type: 'metadata',
			  sources: usedDocuments
			})}\n\n`);
          }
        } catch (e) {
          console.error('Erro ao processar chunk do stream:', e.message);
        }
      }
    });
    
    // Quando o stream terminar
    response.data.on('end', () => {
      res.end();
    });
    
    // Tratar erros no stream
    response.data.on('error', (err) => {
      console.error('Erro no stream:', err);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Erro ao processar stream: ' + err.message 
      })}\n\n`);
      res.end();
    });
    
  } catch (error) {
    console.error('Erro ao processar mensagem:', error.message);
    
    // Se os cabeçalhos ainda não foram enviados, responder com JSON
    if (!res.headersSent) {
      res.status(500).json({ 
        mensagem: 'Erro ao processar mensagem', 
        error: error.message 
      });
    } else {
      // Se já iniciamos o streaming, enviar erro como evento
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Erro ao processar mensagem: ' + error.message 
      })}\n\n`);
      res.end();
    }
  }
};

module.exports = {
  checkLLMStatus,
  sendMessage: sendMessageStreaming  // Usar a versão com streaming por padrão
};