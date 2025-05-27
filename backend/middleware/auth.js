// middleware/auth.js - Versão melhorada com suporte a token via query
const jwt = require('jsonwebtoken');

// Middleware melhorado para verificação de token
const auth = (req, res, next) => {
  // Debug para verificar cabeçalhos e query params
  //console.log('Auth middleware: Verificando token de autenticação');
  //console.log('Headers:', {
  //  authorization: req.headers.authorization,
  //  'x-auth-token': req.headers['x-auth-token']
  //});
  //console.log('Query params:', req.query);
  
  // CORREÇÃO: Obter token do cabeçalho OU query parameter (para preview de arquivos)
  let token = req.headers['x-auth-token'] || 
              (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null) ||
              req.query.token; // NOVO: Suporte a token via query parameter
  
  // Verificar se o token existe
  if (!token) {
    console.log('Auth middleware: Token não fornecido');
    return res.status(401).json({ mensagem: 'Token não fornecido. Acesso negado.' });
  }
  
  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Debug detalhado
    //console.log('Auth middleware: Token validado com sucesso:', {
    //  id: decoded.id,
    //  email: decoded.email,
    //  nome: decoded.nome
    //});
    
    // Atribuir dados do usuário ao objeto req
    req.usuario = {
      id: decoded.id, // ID do MongoDB
      email: decoded.email,
      nome: decoded.nome
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware: Erro ao validar token:', error.message);
    return res.status(401).json({ 
      mensagem: 'Token inválido',
      error: error.message
    });
  }
};

module.exports = auth;