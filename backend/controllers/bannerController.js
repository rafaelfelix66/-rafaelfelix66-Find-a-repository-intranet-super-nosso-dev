// backend/controllers/bannerController.js
const { Banner } = require('../models');
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

// Obter apenas banners ativos (para exibição)
const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ active: true })
      .sort({ order: 1, createdAt: -1 });
    
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
	
    const { title, description, link, order } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ mensagem: 'É necessário enviar uma imagem' });
    }
    
    // Processar imagem
	console.log("Arquivo recebido:", req.file.filename);
    const imageUrl = `/uploads/banners/${req.file.filename}`;
    
    const newBanner = new Banner({
      title,
      description,
      imageUrl,
      link: link || '',
      order: order || 0
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
    const { title, description, link, active, order } = req.body;
    
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