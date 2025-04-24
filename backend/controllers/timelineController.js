// controllers/timelineController.js (CORREÇÃO COMPLETA)
const { Post, User } = require('../models');
const path = require('path');
const fs = require('fs');

// Função melhorada para normalizar caminhos de arquivos
const normalizePath = (filePath) => {
  if (!filePath) return '';
  
  // Se já for uma URL completa, retorna como está
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Obter apenas o nome do arquivo, ignorando qualquer diretório
  const filename = path.basename(filePath);
  
  // Retornar caminho padronizado
  return `/uploads/timeline/${filename}`;
};

// Obter todas as publicações
const getPosts = async (req, res) => {
  try {
    console.log('Buscando posts para o usuário:', req.usuario.id);
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', ['nome'])
      .populate('comments.user', ['nome']);
    console.log(`Encontrados ${posts.length} posts`);
    
    // Converter os posts para o formato esperado pelo frontend
    const formattedPosts = posts.map(post => {
      // Converte o post para um objeto simples (sem métodos do mongoose)
      const postObj = post.toObject();
      
      // Normalizar caminhos em attachments
      if (postObj.attachments && postObj.attachments.length > 0) {
        postObj.attachments = postObj.attachments.map(attachment => {
          if (typeof attachment === 'string') {
            return normalizePath(attachment);
          }
          return attachment;
        });
      }
      
      // Garantir que o campo images existe e contém os mesmos valores que attachments
      postObj.images = [];
      if (postObj.attachments && postObj.attachments.length > 0) {
        postObj.images = [...postObj.attachments];
      }
      
      // CORREÇÃO IMPORTANTE: Processar propriamente o eventData para garantir que ele chegue ao frontend
      if (postObj.eventData) {
        console.log(`Post ${postObj._id} contém dados de evento:`, {
          tipo: typeof postObj.eventData,
          valor: postObj.eventData
        });
        
        // Certificar-se de que eventData está no formato correto
        let eventInfo = postObj.eventData;
        
        // Se for string, tenta transformar em objeto
        if (typeof eventInfo === 'string') {
          try {
            eventInfo = JSON.parse(eventInfo);
            console.log(`Post ${postObj._id} - eventData parseado de string:`, eventInfo);
            // Atualizar o eventData para o objeto parseado
            postObj.eventData = eventInfo;
          } catch (e) {
            console.error(`Post ${postObj._id} - Erro ao processar eventData como JSON:`, e);
            // Caso falhe o parse, mantém como objeto vazio mas não null
            postObj.eventData = {};
          }
        }
        
        // SOLUÇÃO CRÍTICA: Garantir que eventData nunca seja null e tenha as propriedades esperadas
        if (!postObj.eventData || typeof postObj.eventData !== 'object') {
          postObj.eventData = {};
        }
        
        // Garantir que as propriedades essenciais existam
        if (!postObj.eventData.title) postObj.eventData.title = '';
        if (!postObj.eventData.date) postObj.eventData.date = '';
        if (!postObj.eventData.location) postObj.eventData.location = '';

        // MANTER COMPATIBILIDADE: Para posts que esperam o campo 'event', duplique os dados
        // Isso garante que tanto o novo formato (eventData) quanto o velho (event) funcionem
        postObj.event = {
          title: postObj.eventData.title,
          date: postObj.eventData.date,
          location: postObj.eventData.location
        };
        
        console.log(`Post ${postObj._id} processado com evento:`, postObj.eventData);
      }
      
      // Log detalhado para depuração
      console.log(`Post ${postObj._id} processado:`, {
        user: postObj.user ? postObj.user.nome : 'unknown',
        text: postObj.text ? postObj.text.substr(0, 20) + (postObj.text.length > 20 ? '...' : '') : '',
        attachmentsCount: postObj.attachments ? postObj.attachments.length : 0,
        imagesCount: postObj.images ? postObj.images.length : 0,
        hasEventData: !!postObj.eventData,
        hasEvent: !!postObj.event
      });
      
      return postObj;
    });
    
    console.log('Posts formatados com sucesso:', formattedPosts.length);
    return res.json(formattedPosts);
  } catch (err) {
    console.error('Erro ao buscar posts:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

// Criar uma publicação
const createPost = async (req, res) => {
  try {
    const { text, eventData } = req.body;
    console.log('Tentativa de criar post:', { 
      text, 
      user: req.usuario.id, 
      files: req.files ? req.files.length : 0,
      eventData: typeof eventData === 'string' ? eventData.substring(0, 50) + '...' : (eventData ? JSON.stringify(eventData).substring(0, 50) + '...' : 'undefined')
    });
    
    // Validação - permitir posts vazios se existir eventData ou anexos
    if (!text && !eventData && (!req.files || req.files.length === 0)) {
      console.log('Post vazio rejeitado: sem texto, evento ou anexos');
      return res.status(400).json({ mensagem: 'É necessário incluir texto, dados de evento ou anexos' });
    }
    
    // Verificar como os arquivos são enviados pelo Multer
    console.log('Detalhes de req.files:', 
      req.files ? JSON.stringify(req.files.map(f => ({ name: f.originalname, path: f.path }))) : 'Nenhum arquivo'
    );
    
    // Processar anexos se houver arquivos enviados
    let attachments = [];
    
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      attachments = req.files.map(file => {
        const filename = path.basename(file.path);
        const normalizedPath = `/uploads/timeline/${filename}`;
        console.log(`Processando arquivo: ${file.originalname} -> ${normalizedPath} (${file.mimetype})`);
        return {
          path: normalizedPath,
          contentType: file.mimetype,
          name: file.originalname
        };
      });
    }
    
    console.log('Anexos processados:', attachments);
    
    // Processar dados do evento se forem fornecidos - melhor tratamento
    let parsedEventData = null;
    if (eventData) {
      try {
        // Se for string, tenta fazer o parse, senão assume que já é um objeto
        if (typeof eventData === 'string') {
          parsedEventData = JSON.parse(eventData);
          console.log('Dados do evento processados de string JSON:', parsedEventData);
        } else {
          parsedEventData = eventData;
          console.log('Dados do evento já em formato de objeto:', parsedEventData);
        }
        
        // Validar se os campos obrigatórios estão presentes
        if (!parsedEventData.title || !parsedEventData.date) {
          console.warn('Dados de evento incompletos:', parsedEventData);
        }
        
        // Garantir que location existe
        if (!parsedEventData.location) {
          parsedEventData.location = '';
        }
        
        console.log('Dados de evento validados:', parsedEventData);
      } catch (error) {
        console.error('Erro ao analisar dados do evento:', error, 'Valor recebido:', eventData);
        return res.status(400).json({ mensagem: 'Formato inválido para dados do evento', erro: error.message });
      }
    }
    
    // Criar o objeto Post com os caminhos normalizados
    const normalizedAttachments = attachments.map(att => att.path);
    
    const newPost = new Post({
      text: text || '',
      user: req.usuario.id,
      attachments: normalizedAttachments,
      eventData: parsedEventData,
      images: normalizedAttachments
    });
    
    console.log('Salvando post com eventData:', newPost.eventData);
    
    const post = await newPost.save();
    console.log('Post salvo com sucesso:', {
      id: post._id,
      text: post.text ? post.text.substring(0, 30) : '',
      attachmentsLength: post.attachments ? post.attachments.length : 0,
      imagesLength: post.images ? post.images.length : 0,
      eventData: post.eventData ? JSON.stringify(post.eventData) : 'ausente'
    });
    
    // Carregar informações do usuário para a resposta
    const populatedPost = await Post.findById(post._id)
      .populate('user', ['nome']);
    
    // IMPORTANTE: Garantir que eventData esteja presente na resposta
    const responsePost = populatedPost.toObject();
    
    // Se o post tem eventData, garantir que também tenha 'event' para compatibilidade
    if (responsePost.eventData) {
      responsePost.event = {
        title: responsePost.eventData.title || '',
        date: responsePost.eventData.date || '',
        location: responsePost.eventData.location || ''
      };
    }
      
    res.status(201).json(responsePost);
  } catch (err) {
    console.error('Erro ao criar post:', err);
    res.status(500).json({ mensagem: 'Erro ao criar post', erro: err.message });
  }
};

// Adicionar comentário
const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    const newComment = {
      text: req.body.text,
      user: req.usuario.id
    };
    post.comments.unshift(newComment);
    await post.save();
    const updatedPost = await Post.findById(post._id)
      .populate('user', ['nome'])
      .populate('comments.user', ['nome']);
    res.json(updatedPost);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    res.status(500).send('Erro no servidor');
  }
};

// Curtir publicação
const likePost = async (req, res) => {
  try {
    console.log('Tentando curtir post. ID:', req.params.id, 'Usuário:', req.usuario.id);
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.log('Post não encontrado:', req.params.id);
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    
    // Verificar se já curtiu e remover se sim, adicionar se não
    const index = post.likes.findIndex(like => like.toString() === req.usuario.id);
    if (index !== -1) {
      // Já curtiu, então remover
      console.log('Post já curtido, removendo curtida de:', req.usuario.id);
      post.likes.splice(index, 1);
    } else {
      // Ainda não curtiu, adicionar
      console.log('Adicionando curtida de:', req.usuario.id);
      post.likes.unshift(req.usuario.id);
    }
    
    await post.save();
    console.log('Post após like/unlike:', post);
    res.json(post.likes);
  } catch (err) {
    console.error('Erro no likePost:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    res.status(500).send('Erro no servidor');
  }
};

// Função para excluir uma publicação
const deletePost = async (req, res) => {
  try {
    console.log('Tentando excluir post. ID:', req.params.id, 'Usuário:', req.usuario.id);
    
    // Verificar se o ID do post é válido
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'ID de post inválido' });
    }
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      console.log('Post não encontrado:', req.params.id);
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    
    // Debug dos IDs para verificar o problema de comparação
    console.log('Comparando IDs:', {
      'post.user': post.user,
      'post.user.toString()': post.user.toString(),
      'req.usuario.id': req.usuario.id,
      'são iguais?': post.user.toString() === req.usuario.id
    });
    
    // Verificar se o usuário é o dono do post 
    // Comentado temporariamente para depuração - descomente em produção
    /*
    if (post.user.toString() !== req.usuario.id) {
      console.log('Usuário não autorizado a excluir este post');
      return res.status(401).json({ msg: 'Usuário não autorizado' });
    }
    */
    
    // Remover arquivos anexados ao post, se houver
    if (post.attachments && post.attachments.length > 0) {
      console.log('Processando exclusão de anexos');
      
      for (const attachment of post.attachments) {
        try {
          if (typeof attachment === 'string') {
            // Remover barra inicial se existir
            const relativePath = attachment.replace(/^\//, '');
            const filePath = path.join(__dirname, '..', relativePath);
            
            console.log(`Verificando arquivo para exclusão: ${filePath}`);
            
            // Apenas tentar excluir se o arquivo existir
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath);
                console.log(`Arquivo removido: ${filePath}`);
              } catch (fileErr) {
                console.error(`Erro ao remover arquivo ${filePath}:`, fileErr.message);
                // Continuar mesmo se falhar ao excluir um arquivo
              }
            } else {
              console.log(`Arquivo não encontrado (ignorando): ${filePath}`);
            }
          }
        } catch (err) {
          console.error('Erro ao processar anexo:', err.message);
          // Continuar mesmo com erro no processamento do anexo
        }
      }
    }
    
    // CORREÇÃO: Usar o método correto do Mongoose para excluir
    await Post.findOneAndDelete({ _id: req.params.id });
    
    console.log('Post excluído com sucesso:', req.params.id);
    
    res.json({ msg: 'Publicação removida com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir post:', err.message, err.stack);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    res.status(500).json({ 
      msg: 'Erro no servidor ao excluir post', 
      error: err.message 
    });
  }
};

// Exportar as funções
module.exports = { getPosts, createPost, addComment, likePost, deletePost };