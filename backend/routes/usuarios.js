// backend/routes/usuarios.js

const express = require('express');
const router = express.Router();
const { User } = require('../models');
const auth = require('../middleware/auth');

// @route   GET api/usuarios/aniversariantes
// @desc    Obter aniversariantes do dia
// @access  Private
router.get('/aniversariantes', auth, async (req, res) => {
  try {
    console.log('Rota de aniversariantes acessada');
    
    // Buscar todos os usuários ativos
    const usuarios = await User.find({ ativo: true }).select('nome dataNascimento dataAdmissao');
    console.log(`Total de usuários ativos: ${usuarios.length}`);
    
    // Filtrar aniversariantes do dia
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const mesHoje = hoje.getMonth();
    console.log(`Buscando aniversariantes para: ${diaHoje}/${mesHoje + 1}`);
    
    const aniversariantes = usuarios.filter(usuario => {
      let isAniversariante = false;
      
      // Verificar aniversário de nascimento
      if (usuario.dataNascimento) {
        const dataNasc = new Date(usuario.dataNascimento);
        if (dataNasc.getDate() === diaHoje && dataNasc.getMonth() === mesHoje) {
          console.log(`Aniversário de nascimento: ${usuario.nome}`);
          isAniversariante = true;
        }
      }
      
      // Verificar aniversário de empresa
      if (usuario.dataAdmissao) {
        const dataAdm = new Date(usuario.dataAdmissao);
        if (dataAdm.getDate() === diaHoje && dataAdm.getMonth() === mesHoje) {
          console.log(`Aniversário de empresa: ${usuario.nome}`);
          isAniversariante = true;
        }
      }
      
      return isAniversariante;
    });
    
    console.log(`Aniversariantes encontrados: ${aniversariantes.length}`);
    res.json(aniversariantes);
  } catch (err) {
    console.error('Erro ao buscar aniversariantes:', err);
    res.status(500).json({ mensagem: 'Erro ao buscar aniversariantes', error: err.message });
  }
});

// @route   GET api/usuarios
// @desc    Obter todos os usuários
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const usuarios = await User.find({}, '-password');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuários', error: error.message });
  }
});

module.exports = router;