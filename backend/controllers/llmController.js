// controllers/llmController.js - Versão aprimorada
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { File } = require('../models');


let pdfParseAvailable = false;
let pdfParse;

try {
  pdfParse = require('pdf-parse');
  pdfParseAvailable = true;
  console.log('Módulo pdf-parse carregado com sucesso');
} catch (error) {
  console.warn('Módulo pdf-parse não encontrado, tentando instalar...');
  
  // Tentar instalar o módulo dinamicamente
  try {
    const { execSync } = require('child_process');
    execSync('npm install pdf-parse@1.1.1 --no-save', { stdio: 'inherit' });
    
    // Tentar carregar após instalação
    try {
      pdfParse = require('pdf-parse');
      pdfParseAvailable = true;
      console.log('Módulo pdf-parse instalado e carregado com sucesso');
    } catch (loadError) {
      console.error('Falha ao carregar pdf-parse após instalação:', loadError.message);
    }
  } catch (installError) {
    console.error('Falha ao instalar pdf-parse:', installError.message);
  }
}


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
  if (pdfParseAvailable) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      console.log(`PDF extraído com sucesso: ${path.basename(filePath)} (${pdfData.text.length} caracteres)`);
      return pdfData.text.substring(0, 10000);
    } catch (pdfErr) {
      console.error(`Erro ao extrair PDF ${filePath}:`, pdfErr.message);
    }
  }
  
  // Fallback para quando pdf-parse não está disponível
  console.warn(`Usando extração simulada para PDF ${filePath}`);
  return `[Não foi possível extrair o conteúdo do PDF: ${path.basename(filePath)}. O módulo pdf-parse não está disponível.]`;
}    // Para documentos Word/Office, seria necessÃ¡rio uma biblioteca especÃ­fica
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension?.toLowerCase()) ||
        mimeType?.includes('officedocument')) {
      // SimulaÃ§Ã£o - em um cenÃ¡rio real, usarÃ­amos uma biblioteca adequada
      return `[ConteÃºdo extraÃ­do do documento Office: ${path.basename(filePath)}]`;
    }
    
    // Para outros tipos, retornar informaÃ§Ã£o bÃ¡sica
    return `[Este arquivo Ã© do tipo ${mimeType || extension} e nÃ£o foi possÃ­vel extrair texto diretamente]`;
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
       console.log("Buscando arquivos com RAG habilitado no banco de dados...");
      
      // FILTRO PRINCIPAL: Buscar apenas arquivos com allowRAG = true
      const ragEnabledFiles = await File.find({
        allowRAG: true, // NOVO: Filtro principal para RAG
        $or: [
          { owner: userId },
          { 'sharedWith.user': userId },
          { isPublic: true },
          { departamentoVisibilidade: { $in: ['TODOS'] } }
        ]
      });
      
      console.log(`Encontrados ${ragEnabledFiles.length} arquivos com RAG habilitado no banco de dados`);
      
	  // Log detalhado dos arquivos encontrados
      ragEnabledFiles.forEach(file => {
        console.log(`- Arquivo RAG: ${file.name} (ID: ${file._id}) - Tipo: ${file.type}`);
      });
	  
      // Processar arquivos do banco que têm RAG habilitado
      for (const file of ragEnabledFiles) {
        try {
          // Pular links, focar apenas em arquivos físicos
          if (file.type === 'link') {
            console.log(`Pulando link: ${file.name}`);
            continue;
          }
          
          const filePath = resolveFilePath(file.path);
          
          if (!filePath || processedPaths.has(filePath)) continue;
          processedPaths.add(filePath);
          
          if (!fs.existsSync(filePath)) {
            console.warn(`Arquivo com RAG não encontrado: ${filePath}`);
            continue;
          }
          
          // Ler conteúdo e calcular similaridade
          const content = await extractTextFromFile(
            filePath,
            file.mimeType,
            file.extension
          );
          
          if (!content) {
            console.log(`Não foi possível extrair conteúdo de: ${file.name}`);
            continue;
          }
          
          const fileEmbedding = await generateEmbedding(content);
          if (!fileEmbedding) {
            console.log(`Não foi possível gerar embedding para: ${file.name}`);
            continue;
          }
          
          const similarity = cosineSimilarity(queryEmbedding, fileEmbedding);
          
          console.log(`Arquivo processado: ${file.name} - Similaridade: ${similarity.toFixed(4)}`);
          
          allDocuments.push({
            file: {
              id: file._id.toString(),
              name: file.name || path.basename(filePath),
              path: filePath,
              mimeType: file.mimeType,
              extension: file.extension,
              allowRAG: file.allowRAG
            },
            content: content.substring(0, 2000), // Limitar tamanho do contexto
            similarity
          });
          
        } catch (error) {
          console.error(`Erro ao processar arquivo RAG ${file.name || file.path}:`, error.message);
        }
      }
    } catch (dbError) {
      console.error("Erro ao buscar arquivos com RAG no banco de dados:", dbError.message);
    }
    
     // PARTE 2: REMOVIDA - Não buscar mais arquivos do diretório sem controle
    // Agora só utilizamos arquivos explicitamente marcados para RAG
    
        // Ordenar por similaridade e obter os mais relevantes
    const relevantDocuments = allDocuments
      .filter(doc => doc.similarity > 0.1) // Filtro mínimo de similaridade
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);  // Top 5 mais relevantes
    
    console.log(`=== RESULTADO FINAL ===`);
    console.log(`Total de documentos processados: ${allDocuments.length}`);
    console.log(`Documentos relevantes selecionados: ${relevantDocuments.length}`);
    
    relevantDocuments.forEach((doc, idx) => {
      console.log(`${idx+1}. ${doc.file.name} (Similaridade: ${doc.similarity.toFixed(4)}) - RAG: ${doc.file.allowRAG}`);
    });
    
    if (relevantDocuments.length === 0) {
      console.log("⚠️  NENHUM DOCUMENTO RELEVANTE ENCONTRADO");
      console.log("Possíveis causas:");
      console.log("- Nenhum arquivo tem a flag allowRAG habilitada");
      console.log("- Nenhum arquivo é acessível pelo usuário");
      console.log("- Baixa similaridade com a consulta");
    }
    
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
    const systemPrompt = "Você é a Gabi, assistente da Intranet Super Nosso que responde perguntas com base nos documentos disponíveis. Seja clara, objetiva e útil.";
    
    let contextPrompt = "";
    let documentIds = [];
    
    if (documents && documents.length > 0) {
      contextPrompt = "Contexto extraído dos documentos aprovados para IA:\n\n";
      
      documents.forEach((doc, index) => {
        // Adicionar documento numerado ao contexto
        contextPrompt += `=== DOCUMENTO ${index + 1}: ${doc.file.name} ===\n${doc.content}\n\n`;
        documentIds.push({
          id: doc.file.id,
          name: doc.file.name,
          index: index + 1,
          similarity: doc.similarity
        });
      });
      
      // Instruções específicas para identificar a fonte 
      contextPrompt += "INSTRUÇÕES IMPORTANTES:\n" +
                      "1. Você DEVE citar explicitamente de qual documento (pelo número e nome) você obteve cada informação\n" +
                      "2. Se usar múltiplos documentos, cite cada um deles quando usar sua informação\n" +
                      "3. Responda com base APENAS nos documentos fornecidos acima\n" +
                      "4. Se não encontrar a informação nos documentos, informe claramente\n" +
                      "5. Todos os documentos foram pré-aprovados pela empresa para uso na IA\n";
    } else {
      contextPrompt = "Não foram encontrados documentos relevantes aprovados para IA para esta consulta. " +
                     "Isso pode significar que:\n" +
                     "- Nenhum documento foi marcado como disponível para IA\n" +
                     "- Os documentos disponíveis não são relevantes para sua pergunta\n" +
                     "- Você pode não ter acesso aos documentos relacionados\n\n" +
                     "Por favor, responda com seu conhecimento geral, mas informe que não há documentos específicos da empresa disponíveis.";
    }
    
    // Montar o prompt final
    const prompt = `${systemPrompt}\n\n${contextPrompt}\n\nPergunta: ${query}\n\nResposta:`;
    
    console.log(`Enviando prompt para o LLM (${prompt.length} caracteres)`);
    console.log(`Documentos incluídos no contexto: ${documentIds.length}`);
    
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
          doc.name.toLowerCase()
        ];
        
        if (docMentionPatterns.some(pattern => 
          llmResponse.toLowerCase().includes(pattern.toLowerCase())
        )) {
          usedDocuments.push({
            id: doc.id,
            name: doc.name,
            similarity: doc.similarity
          });
        }
      }
      
      // Se não encontrou nenhuma menção explícita mas há documentos, usar o mais relevante
      if (usedDocuments.length === 0 && documents.length > 0) {
        const mostRelevantDoc = documents[0];
        usedDocuments.push({
          id: mostRelevantDoc.file.id,
          name: mostRelevantDoc.file.name,
          similarity: mostRelevantDoc.similarity,
          note: 'Documento mais relevante (inferido)'
        });
      }
    }
    
    console.log(`Documentos utilizados na resposta: ${usedDocuments.length}`);
    usedDocuments.forEach(doc => {
      console.log(`- ${doc.name} (Similaridade: ${doc.similarity?.toFixed(4) || 'N/A'})`);
    });
    
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

// Função para streaming com suporte melhorado para RAG
const sendMessageStreaming = async (req, res) => {
  try {
    console.log('=== INÍCIO PROCESSAMENTO LLM COM RAG ===');
    console.log('- Message:', req.body.message);
    console.log('- Usuário:', req.usuario.id);
    
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ mensagem: 'Mensagem não fornecida' });
    }
    
    // Buscar documentos relevantes com RAG habilitado
    console.log('Iniciando busca de documentos relevantes...');
    const relevantDocs = await findRelevantDocuments(message, req.usuario.id);
    console.log(`Documentos encontrados: ${relevantDocs.length}`);
    
    // Configurar cabeçalhos para streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Para Nginx
    
    // Construir o prompt com contexto numerado
    const systemPrompt = "Seu nome é Gabi, você é uma assistente da Intranet Super Nosso que responde perguntas com base nos documentos aprovados para IA. Seja clara, objetiva e útil.";
    
    let contextPrompt = "";
    let documentIds = [];
    
    if (relevantDocs.length > 0) {
      contextPrompt = "Contexto extraído dos documentos aprovados para IA:\n\n";
      
      relevantDocs.forEach((doc, index) => {
        contextPrompt += `=== DOCUMENTO ${index + 1}: ${doc.file.name} ===\n${doc.content}\n\n`;
        documentIds.push({
          id: doc.file.id,
          name: doc.file.name,
          index: index + 1,
          similarity: doc.similarity
        });
      });
      
      contextPrompt += "INSTRUÇÕES MUITO IMPORTANTES:\n";
      contextPrompt += "1. Você DEVE citar explicitamente qual documento (número e nome) foi usado para cada parte da sua resposta\n";
      contextPrompt += "2. Comece sua resposta com 'De acordo com os documentos aprovados para IA, ...' e cite cada fonte usada\n";
      contextPrompt += "3. Se você não encontrar a informação nos documentos, informe claramente\n";
      contextPrompt += "4. NUNCA invente informações que não estejam nos documentos\n";
      contextPrompt += "5. Seu nome é Gabi\n";
      contextPrompt += "6. Todos os documentos foram pré-aprovados pela empresa para uso na IA\n";
    } else {
      contextPrompt = "Não foram encontrados documentos relevantes aprovados para IA para esta consulta. " +
                     "Informe ao usuário que não há documentos específicos da empresa disponíveis para esta pergunta, " +
                     "mas ofereça ajuda com conhecimento geral se apropriado.";
    }
    
    const prompt = `${systemPrompt}\n\n${contextPrompt}\n\nPergunta: ${message}\n\nResposta:`;
    
    console.log(`Enviando prompt para o LLM (${prompt.length} caracteres)`);
    console.log(`Documentos no contexto: ${documentIds.length}`);
    
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
              const docMentionPatterns = [
                `DOCUMENTO ${doc.index}`,
                `Documento ${doc.index}`,
                `documento ${doc.index}`,
                doc.name.toLowerCase()
              ];
              
              if (docMentionPatterns.some(pattern => 
                completeResponse.toLowerCase().includes(pattern.toLowerCase())
              )) {
                usedDocuments.push({
                  id: doc.id,
                  name: doc.name,
                  similarity: doc.similarity
                });
              }
            }
            
            // Garantir que pelo menos um documento seja citado se houver contexto
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

            console.log(`=== RESULTADO FINAL ===`);
            console.log(`Documentos utilizados: ${usedDocuments.length}`);
            usedDocuments.forEach(doc => {
              console.log(`- ${doc.name} (${doc.similarity?.toFixed(4) || 'N/A'})`);
            });

            // Enviar metadados com os documentos utilizados
            res.write(`data: ${JSON.stringify({
              type: 'metadata',
              sources: usedDocuments,
              documentsFound: relevantDocs.length,
              documentsUsed: usedDocuments.length
            })}\n\n`);
          }
        } catch (e) {
          console.error('Erro ao processar chunk do stream:', e.message);
        }
      }
    });
    
    // Quando o stream terminar
    response.data.on('end', () => {
      console.log('=== STREAM FINALIZADO ===');
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