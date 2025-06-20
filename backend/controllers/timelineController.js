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

 // Validar departamentos se fornecidos
    const departamentosValidos = [
      'TODOS',
      'A CLASSIFICAR',
      'ADMINISTRATIVA', 
      'ADMINISTRATIVO', 
      'LIDERANÇA', 
      'OPERACIONAL'
    ];
// Obter uma publicação específica
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', ['nome', 'avatar', 'cargo', 'departamento'])
      .populate('comments.user', ['nome', 'avatar', 'cargo', 'departamento']);
    
    if (!post) {
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    
    // Formatar o post para o frontend (usando a mesma lógica do getPosts)
    const postObj = post.toObject();
    
    // Normalizar caminhos em attachments, processar eventData, etc.
    // (mesma lógica de formatação que você usa em getPosts)
    
    return res.json(postObj);
  } catch (err) {
    console.error('Erro ao buscar post específico:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    
    res.status(500).send('Erro no servidor');
  }
};
// Obter todas as publicações
const getPosts = async (req, res) => {
  try {
    // Parâmetros de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Buscar usuário com suas informações de departamento
    const user = await User.findById(req.usuario.id);
    if (!user) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    
    console.log('Buscando posts para usuário:', req.usuario.id, 'Departamento:', user.departamento);
    
    // Construir query para posts
    const query = {
      $or: [
        { departamentoVisibilidade: 'TODOS' },
        { departamentoVisibilidade: user.departamento }
      ]
    };

    console.log('Query de busca:', JSON.stringify(query));
    
    // Buscar posts com paginação
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', ['nome', 'avatar', 'cargo', 'departamento'])
      .populate('comments.user', ['nome', 'avatar', 'cargo', 'departamento']);
    
    // Contar total para paginação
    const totalPosts = await Post.countDocuments(query);
    
    console.log(`Encontrados ${posts.length} posts (página ${page}/${Math.ceil(totalPosts / limit)})`);
    
    // Converter os posts para o formato esperado pelo frontend
    const formattedPosts = posts.map(post => {
      const postObj = post.toObject();
      
      // Normalizar caminhos de arquivos se existirem
      if (postObj.attachments && postObj.attachments.length > 0) {
        postObj.attachments = postObj.attachments.map(attachment => 
          attachment ? normalizePath(attachment) : ''
        ).filter(Boolean);
      }
      
      // Processar eventData se existir
      if (postObj.eventData) {
        try {
          if (typeof postObj.eventData === 'string') {
            postObj.eventData = JSON.parse(postObj.eventData);
          }
        } catch (e) {
          console.error('Erro ao fazer parse do eventData:', e);
          postObj.eventData = null;
        }
      }
      
      return postObj;
    });
    
    // Retornar com informações de paginação
    res.json({
      posts: formattedPosts,
      pagination: {
        current: page,
        limit,
        total: totalPosts,
        pages: Math.ceil(totalPosts / limit),
        hasNext: page < Math.ceil(totalPosts / limit),
        hasPrev: page > 1
      }
    });
    
  } catch (err) {
    console.error('Erro no timelineController.getPosts:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

// Criar uma publicação
const createPost = async (req, res) => {
  try {
    const { text, eventData, departamentoVisibilidade  } = req.body;
    console.log('Tentativa de criar post:', { 
      text, 
      user: req.usuario.id, 
      files: req.files ? req.files.length : 0,
      eventData: typeof eventData === 'string' ? eventData.substring(0, 50) + '...' : (eventData ? JSON.stringify(eventData).substring(0, 50) + '...' : 'undefined'),
	  departamentoVisibilidade
    });
    
	// Processar departamentos de visibilidade
let departamentosProcessados = ['TODOS']; // Valor padrão

if (departamentoVisibilidade) {
  try {
    // Se for string, tenta fazer o parse para obter array
    if (typeof departamentoVisibilidade === 'string') {
      departamentosProcessados = JSON.parse(departamentoVisibilidade);
    } else {
      departamentosProcessados = departamentoVisibilidade;
    }
    console.log('Departamentos processados:', departamentosProcessados);
  } catch (error) {
    console.error('Erro ao processar departamentos:', error);
  }
}
	
	
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
    
	console.log('Antes do newPost:', {
      id: req.usuario.id,
      text: req.text ? req.text.substring(0, 30) : '',
	  departamentoVisibilidade: departamentosProcessados
      });
	
    const newPost = new Post({
      text: text || '',
      user: req.usuario.id,
	  departamentoVisibilidade: departamentosProcessados,
      attachments: normalizedAttachments,
      eventData: parsedEventData,
      images: normalizedAttachments
    });
    
	//console.log('Tem departamentoVisibilidade no schema?', 'departamentoVisibilidade' in newPost);
	//console.log('Modelo antes de salvar:', newPost);
	
	console.log('Depois do newPost:', {
      id: newPost._id,
      text: newPost.text ? newPost.text.substring(0, 30) : '',
	  departamentoVisibilidade: newPost.departamentoVisibilidade
      });
    
	//newPost.targetAudience = validatedAudience;
    //console.log('Após forçar targetAudience:', newPost.targetAudience);
	
	console.log('Salvando post com eventData:', newPost.eventData);
    
    const post = await newPost.save();
    console.log('Post salvo com sucesso:', {
      id: post._id,
	  departamentoVisibilidade: post.departamentoVisibilidade,
      text: post.text ? post.text.substring(0, 30) : '',
      attachmentsLength: post.attachments ? post.attachments.length : 0,
      imagesLength: post.images ? post.images.length : 0,
      eventData: post.eventData ? JSON.stringify(post.eventData) : 'ausente'
    });
	
	const postFromDB = await Post.findById(post._id).lean();
console.log('Post recuperado do DB:', postFromDB);
    
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

// Curtir comentário
const likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.usuario.id;
    
    console.log('Tentando curtir comentário:', { postId, commentId, userId });
    
    // Buscar o post
    const post = await Post.findById(postId);
    if (!post) {
      console.log('Post não encontrado:', postId);
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    
    // Encontrar o comentário
    const comment = post.comments.id(commentId);
    if (!comment) {
      console.log('Comentário não encontrado:', commentId);
      return res.status(404).json({ msg: 'Comentário não encontrado' });
    }
    
    // Inicializar array de likes se não existir
    if (!comment.likes) {
      comment.likes = [];
    }
    
    // Verificar se já curtiu e remover se sim, adicionar se não
    const likeIndex = comment.likes.findIndex(like => like.toString() === userId);
    
    if (likeIndex !== -1) {
      // Já curtiu, então remover
      console.log('Comentário já curtido, removendo curtida de:', userId);
      comment.likes.splice(likeIndex, 1);
    } else {
      // Ainda não curtiu, adicionar
      console.log('Adicionando curtida de:', userId);
      comment.likes.push(userId);
    }
    
    // Salvar o post com as alterações
    await post.save();
    
    // Retornar o post atualizado com populate
    const updatedPost = await Post.findById(postId)
      .populate('user', ['nome', 'avatar', 'cargo', 'departamento'])
      .populate('comments.user', ['nome', 'avatar', 'cargo', 'departamento']);
    
    console.log('Comentário curtido/descurtido com sucesso');
    res.json(updatedPost);
    
  } catch (err) {
    console.error('Erro ao curtir comentário:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'ID inválido' });
    }
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
};

// Adicionar/remover reação
const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const postId = req.params.id;
    const userId = req.usuario.id;
    
    console.log('Tentando adicionar reação:', { postId, emoji, userId });
    
    if (!emoji) {
      return res.status(400).json({ msg: 'Emoji é obrigatório' });
    }
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    
    // Inicializar array de reações se não existir
    if (!post.reactions) {
      post.reactions = [];
    }
    
    // Procurar se já existe uma reação com este emoji
    let reactionIndex = post.reactions.findIndex(reaction => reaction.emoji === emoji);
    
    if (reactionIndex !== -1) {
      // Reação já existe, verificar se o usuário já reagiu
      const userIndex = post.reactions[reactionIndex].users.findIndex(
        user => user.toString() === userId
      );
      
      if (userIndex !== -1) {
        // Usuário já reagiu com este emoji, remover
        post.reactions[reactionIndex].users.splice(userIndex, 1);
        post.reactions[reactionIndex].count = post.reactions[reactionIndex].users.length;
        
        // Se não há mais usuários, remover a reação completamente
        if (post.reactions[reactionIndex].users.length === 0) {
          post.reactions.splice(reactionIndex, 1);
        }
      } else {
        // Usuário não reagiu com este emoji ainda, adicionar
        post.reactions[reactionIndex].users.push(userId);
        post.reactions[reactionIndex].count = post.reactions[reactionIndex].users.length;
      }
    } else {
      // Reação não existe, criar nova
      post.reactions.push({
        emoji: emoji,
        users: [userId],
        count: 1
      });
    }
    
    // Remover reações do usuário com outros emojis (um usuário só pode ter uma reação por post)
    post.reactions = post.reactions.map(reaction => {
      if (reaction.emoji !== emoji) {
        const userIndex = reaction.users.findIndex(user => user.toString() === userId);
        if (userIndex !== -1) {
          reaction.users.splice(userIndex, 1);
          reaction.count = reaction.users.length;
        }
      }
      return reaction;
    }).filter(reaction => reaction.count > 0); // Remover reações vazias
    
    await post.save();
    
    console.log('Reação processada com sucesso');
    res.json(post.reactions);
    
  } catch (err) {
    console.error('Erro ao processar reação:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
};

// Excluir comentário (apenas para admins)
const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.usuario.id;
    
    console.log('Tentando excluir comentário:', { postId, commentId, userId });
    
    // Buscar o post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    
    // Encontrar o comentário
    const commentIndex = post.comments.findIndex(
      comment => comment._id.toString() === commentId
    );
    
    if (commentIndex === -1) {
      return res.status(404).json({ msg: 'Comentário não encontrado' });
    }
    
    // Verificar se o usuário tem permissão (já verificado no middleware, mas dupla verificação)
    const { User } = require('../models');
    const user = await User.findById(userId);
    
    const isAdmin = user.roles?.includes('admin') || 
                   user.permissions?.includes('timeline:delete_any_comment');
    
    if (!isAdmin) {
      return res.status(403).json({ msg: 'Acesso negado. Apenas administradores podem excluir comentários.' });
    }
    
    // Remover o comentário
    post.comments.splice(commentIndex, 1);
    await post.save();
    
    // Retornar o post atualizado
    const updatedPost = await Post.findById(postId)
      .populate('user', ['nome', 'avatar', 'cargo', 'departamento'])
      .populate('comments.user', ['nome', 'avatar', 'cargo', 'departamento']);
    
    console.log('Comentário excluído com sucesso');
    res.json(updatedPost);
    
  } catch (err) {
    console.error('Erro ao excluir comentário:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'ID inválido' });
    }
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
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
module.exports = { 
  getPosts, 
  createPost, 
  addComment, 
  likePost, 
  deletePost, 
  getPostById,
  likeComment ,
  addReaction,    
  deleteComment   
};