// controllers/authController.js
const { User } = require('../models');
const jwt = require('jsonwebtoken');

// Função register
const register = async (req, res) => {
  try {
    const { nome, email, password, cargo, departamento } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ mensagem: 'Email já cadastrado' });
    }
    user = new User({ nome, email, password, cargo, departamento });
    await user.save();
    const token = jwt.sign(
      { id: user._id, email, nome },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ mensagem: 'Usuário registrado com sucesso', token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ mensagem: 'Erro ao registrar usuário' });
  }
};

// Função login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
	console.log('Tentativa de login:', { email, password }); // Adicionado
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    const isMatch = await user.comparePassword(password); // Usando bcrypt
    if (!isMatch) {
      return res.status(401).json({ mensagem: 'Senha incorreta' });
    }
    user.ultimoAcesso = new Date();
    await user.save();
    const token = jwt.sign(
      { id: user._id, email: user.email, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
	console.log('Token gerado:', token); // Adicionado
    res.json({
      token,
      usuario: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
        departamento: user.departamento,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ mensagem: 'Erro no login' });
  }
};

// Exportar como objeto
module.exports = { register, login };