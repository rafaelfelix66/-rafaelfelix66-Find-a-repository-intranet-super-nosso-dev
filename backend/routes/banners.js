// backend/routes/banners.js
const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/permissions');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Criar diretório se não existir
    const uploadDir = path.join(__dirname, '../uploads/banners');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `banner-${uniqueSuffix}${ext}`);
  }
});

// Filtro para permitir apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  
  cb(new Error('Apenas imagens são permitidas'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Rotas públicas
router.get('/', bannerController.getActiveBanners);

// Rotas administrativas
router.get('/all', auth, hasPermission('banners:view'), bannerController.getAllBanners);
router.post('/', auth, hasPermission('banners:create'), upload.single('image'), bannerController.createBanner);
router.put('/:id', auth, hasPermission('banners:edit'), upload.single('image'), bannerController.updateBanner);
router.delete('/:id', auth, hasPermission('banners:delete'), bannerController.deleteBanner);

module.exports = router;