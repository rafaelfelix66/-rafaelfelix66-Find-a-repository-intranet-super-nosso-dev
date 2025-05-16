// backend/controllers/bannerController.js
const { Banner,User } = require('../models');
const path = require('path');
const fs = require('fs');

// Obter todos os banners (incluindo inativos, para administração)
const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find()
      .sort({ order: 1, createdAt: -1 });
    
    res.json(banners);
  } catch (err) {
    console.error('Erro ao buscar banners:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

const getActiveBanners = async (req, res) => {
  try {
    // Verificar se há usuário na requisição
    let userDepartment = 'TODOS';
    
    if (req.usuario && req.usuario.id) {
      // Buscar usuário para verificar departamento
      const user = await User.findById(req.usuario.id);
      userDepartment = user?.departamento || 'TODOS';
    }
    
    console.log(`Buscando banners para usuário: ${req.usuario?.id}`);
    console.log(`Buscando banners para departamento: ${userDepartment}`);
    
    // Construir a consulta para banners ativos
    // Filtrar banners ativos que sejam para TODOS ou para o departamento do usuário
    const query = { 
      active: true,
      $or: [
        { departamentoVisibilidade: 'TODOS' },
        { departamentoVisibilidade: userDepartment }
      ]
    };
    
    console.log('Query de busca:', JSON.stringify(query));
    
    const banners = await Banner.find(query).sort({ order: 1, createdAt: -1 });
    
    console.log(`Encontrados ${banners.length} banners ativos para o departamento ${userDepartment}`);
    
    // Log detalhado dos banners para debug
    if (banners.length > 0) {
      banners.forEach((banner, index) => {
        console.log(`Banner ${index + 1}: ${banner.title}, Depts: ${JSON.stringify(banner.departamentoVisibilidade)}`);
      });
    }
    
    res.json(banners);
  } catch (err) {
    console.error('Erro ao buscar banners:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

// Criar banner
const createBanner = async (req, res) => {
  try {
	console.log("Create Banner - Requisição recebida");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    console.log("Headers:", req.headers['content-type']); 
	
    const { title, description, link, order, departamentoVisibilidade } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ mensagem: 'É necessário enviar uma imagem' });
    }
    
    // Processar imagem
	console.log("Arquivo recebido:", req.file.filename);
    const imageUrl = `/uploads/banners/${req.file.filename}`;
	
	// Processar departamentoVisibilidade
    let depVisibilidade = ['TODOS'];
    if (departamentoVisibilidade) {
      try {
        depVisibilidade = JSON.parse(departamentoVisibilidade);
      } catch (e) {
        console.warn("Erro ao processar departamentoVisibilidade:", e);
        // Manter o valor padrão se houver erro
      }
    }
    
    const newBanner = new Banner({
      title,
      description,
      imageUrl,
      link: link || '',
      order: order || 0,
	  active: true,
      departamentoVisibilidade: depVisibilidade
    });
    
    await newBanner.save();
    res.status(201).json(newBanner);
  } catch (err) {
    console.error('Erro ao criar banner:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

// Atualizar banner
const updateBanner = async (req, res) => {
  try {
    const { title, description, link, active, order, departamentoVisibilidade } = req.body;
    
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ mensagem: 'Banner não encontrado' });
    }
    
    // Atualizar campos
    if (title) banner.title = title;
    if (description) banner.description = description;
    if (link !== undefined) banner.link = link;
    if (active !== undefined) banner.active = active === 'true' || active === true;
    if (order !== undefined) banner.order = Number(order);
	
	 // Processar departamentoVisibilidade
    if (departamentoVisibilidade) {
      try {
        banner.departamentoVisibilidade = JSON.parse(departamentoVisibilidade);
      } catch (e) {
        console.warn("Erro ao processar departamentoVisibilidade na atualização:", e);
        // Manter o valor atual se houver erro
      }
    }
	
    banner.updatedAt = Date.now();
    
    // Atualizar imagem se enviada
    if (req.file) {
      // Remover imagem antiga
      const oldImagePath = path.join(__dirname, '..', banner.imageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      
      banner.imageUrl = `/uploads/banners/${req.file.filename}`;
    }
    
    await banner.save();
    res.json(banner);
  } catch (err) {
    console.error('Erro ao atualizar banner:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

// Remover banner
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ mensagem: 'Banner não encontrado' });
    }
    
    // Remover imagem
    const imagePath = path.join(__dirname, '..', banner.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ mensagem: 'Banner removido com sucesso' });
  } catch (err) {
    console.error('Erro ao remover banner:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

module.exports = { 
  getAllBanners, 
  getActiveBanners, 
  createBanner, 
  updateBanner, 
  deleteBanner 
};