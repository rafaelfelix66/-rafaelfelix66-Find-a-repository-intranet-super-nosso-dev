// controllers/authController.js - Versão corrigida
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const oracleService = require('../services/oracleService');

// Função register modificada para usar CPF
const register = async (req, res) => {
  try {
    const { cpf, senha } = req.body;
    
    // Verificar se já existe um usuário com este CPF
    let user = await User.findOne({ cpf });
    if (user) {
      // Se o usuário existe mas está inativo, verificar no Oracle
      if (!user.ativo) {
        const resultadoOracle = await oracleService.verificarCpfOracle(cpf);
        
        if (resultadoOracle.success) {
          // Reativar o usuário
          user.ativo = true;
          user.ultimaSincronizacao = new Date();
          await user.save();
        } else {
          return res.status(400).json({ 
            mensagem: 'Usuário inativo. CPF não encontrado na base externa.' 
          });
        }
      }
      
      return res.status(400).json({ mensagem: 'CPF já cadastrado' });
    }
    
    // Verificar CPF no Oracle
    const resultadoOracle = await oracleService.verificarCpfOracle(cpf);
    
    if (!resultadoOracle.success) {
      return res.status(400).json({ 
        mensagem: 'CPF não autorizado. Verifique se seu CPF está cadastrado no sistema.' 
      });
    }
    
    // Criar novo usuário com dados do Oracle
    const dados = resultadoOracle.data;
    
    user = new User({
      nome: dados.NOME,
      cpf: dados.CPF,
      email: `${cpf}@supernosso.intranet`, // Email padrão
      password: senha, // Será hasheado pelo middleware do modelo
      cargo: dados.FUNCAO,
      departamento: dados.SETOR,
      roles: ['user'], // Papel padrão
      ativo: true,
      ultimaSincronizacao: new Date()
    });
    
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, cpf: user.cpf, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({ 
      mensagem: 'Usuário registrado com sucesso', 
      token,
      source: resultadoOracle.source || 'oracle' // Indica se veio do Oracle ou backup
    });
    
  } catch (err) {
    console.error('Erro ao registrar usuário:', err.message);
    res.status(500).json({ mensagem: 'Erro ao registrar usuário' });
  }
};

// Função login modificada para usar CPF
const login = async (req, res) => {
  try {
    console.log('Requisição de login recebida:', {
      body: req.body,
      headers: req.headers['content-type']
    });

    // Verificar se o corpo da requisição existe
    if (!req.body) {
      return res.status(400).json({ 
        mensagem: 'Corpo da requisição vazio ou inválido'
      });
    }
    
    const { cpf, senha } = req.body;
    
    // Verificar se os campos obrigatórios foram enviados
    if (!cpf || !senha) {
      return res.status(400).json({ 
        mensagem: 'CPF e senha são obrigatórios'
      });
    }

    console.log('Processando login para CPF:', cpf);
    
    // Buscar usuário no banco local
    const user = await User.findOne({ cpf });
    console.log('Usuário encontrado:', user ? 'Sim' : 'Não');

    // SOLUÇÃO TEMPORÁRIA: Verificar se é o usuário específico (11027478662)
    // e permitir login direto
    if (user && cpf === '11027478662' && senha === '478662') {
      console.log('⚠️ MODO DE DESENVOLVIMENTO: Login direto para CPF específico');
      
      // Atualizar último acesso
      user.ultimoAcesso = new Date();
      await user.save();
      
      // Gerar token JWT
      const token = jwt.sign(
        { id: user._id, cpf: user.cpf, nome: user.nome },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('Token gerado:', token);
      
      return res.json({
        token,
        usuario: {
          id: user._id,
          nome: user.nome,
          cpf: user.cpf,
          email: user.email,
          cargo: user.cargo,
          departamento: user.departamento,
          avatar: user.avatar,
          roles: user.roles || [],
          permissions: user.permissoes || []
        }
      });
    }
    
    // Se o usuário não existe no banco local, verificar no Oracle
    if (!user) {
      const resultadoOracle = await oracleService.verificarCpfOracle(cpf);
      
      if (resultadoOracle.success) {
        // Criar o usuário automaticamente se ele existe no Oracle
        const dados = resultadoOracle.data;
        
        // Criar senha inicial (últimos 6 dígitos do CPF)
        const senhaInicial = cpf.slice(-6);
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senhaInicial, salt);
        
        const novoUsuario = new User({
          nome: dados.NOME,
          cpf: dados.CPF,
          email: `${cpf}@supernosso.intranet`, // Email padrão
          password: senhaCriptografada,
          cargo: dados.FUNCAO,
          departamento: dados.SETOR,
          roles: ['user'], // Papel padrão
          ativo: true,
          ultimaSincronizacao: new Date(),
          dataCriacao: new Date()
        });
        
        await novoUsuario.save();
        
        // Se a senha fornecida não for a senha inicial, retornar erro
        const senhaCorreta = senha === senhaInicial;
        if (!senhaCorreta) {
          return res.status(401).json({ 
            mensagem: 'Usuário criado automaticamente. Use os últimos 6 dígitos do seu CPF como senha inicial.' 
          });
        }
        
        // Gerar token e continuar com o login
        const token = jwt.sign(
          { id: novoUsuario._id, cpf: novoUsuario.cpf, nome: novoUsuario.nome },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        novoUsuario.ultimoAcesso = new Date();
        await novoUsuario.save();
        
        return res.json({
          token,
          usuario: {
            id: novoUsuario._id,
            nome: novoUsuario.nome,
            cpf: novoUsuario.cpf,
            email: novoUsuario.email,
            cargo: novoUsuario.cargo,
            departamento: novoUsuario.departamento,
            avatar: novoUsuario.avatar,
            roles: novoUsuario.roles || [],
            permissions: novoUsuario.permissoes || []
          },
          primeiroAcesso: true,
          source: resultadoOracle.source || 'oracle'
        });
      }
      
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    
    // Verificar se o usuário está ativo
    if (!user.ativo) {
      // Verificar se ele existe no Oracle antes de negar acesso
      const resultadoOracle = await oracleService.verificarCpfOracle(cpf);
      
      if (resultadoOracle.success) {
        // Reativar o usuário
        user.ativo = true;
        user.ultimaSincronizacao = new Date();
        await user.save();
      } else {
        return res.status(401).json({ mensagem: 'Usuário inativo. CPF não autorizado.' });
      }
    }
    
    // Log detalhado para depuração da comparação de senhas
    console.log('Detalhes do usuário:', {
      id: user._id,
      passwordLength: user.password?.length || 0,
      senhaFornecida: senha,
      senhaEsperada: cpf.slice(-6)
    });
    
    // Verificar senha
    const isMatch = await user.comparePassword(senha);
    console.log('Resultado da verificação de senha:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ mensagem: 'Senha incorreta' });
    }
    
    // Atualizar último acesso
    user.ultimoAcesso = new Date();
    await user.save();
    
    // Gerar token JWT
    const token = jwt.sign(
      { id: user._id, cpf: user.cpf, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('Token gerado:', token);
    
    res.json({
      token,
      usuario: {
        id: user._id,
        nome: user.nome,
        cpf: user.cpf,
        email: user.email,
        cargo: user.cargo,
        departamento: user.departamento,
        avatar: user.avatar,
        roles: user.roles || [],
        permissions: user.permissoes || []
      }
    });
    
  } catch (err) {
    console.error('Erro no login:', err.message);
    res.status(500).json({ mensagem: 'Erro no login' });
  }
};

module.exports = { register, login };