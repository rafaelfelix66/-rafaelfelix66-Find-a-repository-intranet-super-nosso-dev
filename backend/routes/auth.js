// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificarToken = require('../middleware/auth'); // Atualizado
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { trackLogin } = require('../middleware/trackEngagement');
const sharp = require('sharp');

// Configuração do multer para upload de avatar
const storage = multer.memoryStorage(); // Usar memória para processar antes de salvar

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  
  cb(new Error('Apenas imagens JPG, PNG ou WebP são permitidas'), false);
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // Reduzido para 2MB
});

// Middleware para processar imagem
const processAvatar = async (req, res, next) => {
  if (!req.file) return next();
  
  try {
    const avatarsDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    
    const filename = `${req.usuario.id}-${Date.now()}.webp`;
    const filepath = path.join(avatarsDir, filename);
    
    // Processar imagem com Sharp
    await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toFile(filepath);
    
    // Adicionar informações do arquivo processado ao req
    req.processedFile = {
      filename,
      path: `/uploads/avatars/${filename}`
    };
    
    next();
  } catch (error) {
    console.error('Erro ao processar avatar:', error);
    return res.status(500).json({ 
      mensagem: 'Erro ao processar imagem',
      detalhes: 'A imagem deve estar em um formato válido (JPG, PNG, WebP)'
    });
  }
};

// @route   POST api/auth/register
// @desc    Registrar usuário
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Autenticar usuário
// @access  Public
router.post('/login', trackLogin(), authController.login);

// @route   GET api/auth/user
// @desc    Obter dados do usuário
// @access  Private
router.get('/user', verificarToken, async (req, res) => {
  const { User } = require('../models'); // Importar aqui
  try {
    const user = await User.findById(req.usuario.id).select('-senha');
    if (!user) return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    
    // Preparar resposta com todos os campos
    const userResponse = {
      _id: user._id,
      nome: user.nome,
      email: user.email,
      cpf: user.cpf,
      chapa: user.chapa,
      cargo: user.cargo,
      departamento: user.departamento,
      filial: user.filial,
      dataAdmissao: user.dataAdmissao,
      dataNascimento: user.dataNascimento,
      avatar: user.avatar,
      roles: user.roles || [],
      permissions: user.permissoes || []
    };
    
    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ mensagem: 'Erro no servidor' });
  }
});

// @route   POST api/auth/avatar
// @desc    Upload de avatar do usuário
// @access  Private
router.post('/avatar', verificarToken, upload.single('avatar'), processAvatar, async (req, res) => {
  const { User } = require('../models');
  
  try {
    if (!req.processedFile) {
      return res.status(400).json({ 
        mensagem: 'Nenhuma imagem enviada ou erro no processamento',
        dica: 'Use imagens em formato JPG, PNG ou WebP com até 2MB'
      });
    }
    
    const user = await User.findById(req.usuario.id);
    if (!user) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    
    // Remover avatar antigo se existir
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    // Atualizar o caminho do avatar
    user.avatar = req.processedFile.path;
    await user.save();
    
    res.json({
      mensagem: 'Avatar atualizado com sucesso',
      avatar: user.avatar,
      dicas: {
        formato: 'Imagem otimizada para 400x400px',
        qualidade: 'Compressão WebP aplicada',
        tamanho: 'Arquivo reduzido automaticamente'
      }
    });
  } catch (err) {
    console.error('Erro ao fazer upload do avatar:', err);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
});

// @route   DELETE api/auth/avatar
// @desc    Remover avatar do usuário
// @access  Private
router.delete('/avatar', verificarToken, async (req, res) => {
  const { User } = require('../models');
  
  try {
    const user = await User.findById(req.usuario.id);
    if (!user) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    
    // Remover arquivo do avatar se existir
    if (user.avatar) {
      const avatarPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }
    
    // Limpar o campo avatar
    user.avatar = null;
    await user.save();
    
    res.json({
      mensagem: 'Avatar removido com sucesso'
    });
  } catch (err) {
    console.error('Erro ao remover avatar:', err);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
});

// @route   GET api/auth/user-permissions
// @desc    Obter dados do usuário com permissões expandidas
// @access  Private
router.get('/user-permissions', verificarToken, async (req, res) => {
  try {
    //console.log('Rota de permissões de usuário acessada');
    //console.log('ID do usuário:', req.usuario.id);
	
    const { User, Role } = require('../models');

    const user = await User.findById(req.usuario.id).select('-password');
    if (!user) {
      console.log('Usuário não encontrado');
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    
    console.log('Usuário encontrado:', user._id);
    
    // Preparar o objeto de resposta
    const userResponse = {
      _id: user._id,
      nome: user.nome,
      email: user.email,
	  cpf: user.cpf,
      chapa: user.chapa,
      cargo: user.cargo,
      departamento: user.departamento,
	  filial: user.filial,
      dataAdmissao: user.dataAdmissao,
      dataNascimento: user.dataNascimento,
      avatar: user.avatar,
      roles: user.roles || [],
      permissions: user.permissoes || [] // Mapear permissoes para o nome esperado pelo frontend
    };
    
    // Se o usuário tem papéis, buscar permissões associadas
    if (user.roles && user.roles.length > 0) {
      try {
        //console.log('Buscando papéis para:', user.roles);
        const userRoles = await Role.find({ name: { $in: user.roles } });
        //console.log('Papéis encontrados:', userRoles.length);
        
        for (const role of userRoles) {
          if (role.permissions && role.permissions.length > 0) {
            userResponse.permissions = [
              ...userResponse.permissions,
              ...role.permissions
            ];
          }
        }
        
        // Remover duplicatas
        userResponse.permissions = [...new Set(userResponse.permissions)];
      } catch (err) {
        console.error('Erro ao buscar papéis:', err.message);
      }
    }
    
    //console.log('Permissões atribuídas:', userResponse.permissions);
    
    res.json(userResponse);
  } catch (err) {
    console.error('Erro ao buscar permissões do usuário:', err);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
});

module.exports = router;