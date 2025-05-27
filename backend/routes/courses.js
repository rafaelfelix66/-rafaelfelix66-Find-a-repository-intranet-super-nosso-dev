// backend/routes/courses.js
const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/permissions');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// NOVO: Importar o middleware de rastreamento de engajamento
const { trackLessonView, trackLessonCompletion } = require('../middleware/trackEngagement');

// Garantir que os diretórios de uploads existam
const uploadsDir = path.join(__dirname, '../uploads/courses');
const materialsDir = path.join(__dirname, '../uploads/courses/materials');

[uploadsDir, materialsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuração do multer para uploads de cursos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
      cb(null, uploadsDir);
    } else if (file.fieldname === 'materials') {
      cb(null, materialsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'thumbnail') {
    // Para thumbnails, apenas imagens
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens são permitidas para thumbnail'), false);
  } else {
    // Para materiais, vários tipos de arquivo
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|mp4|mp3|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Tipo de arquivo não suportado'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Middleware para verificar permissões de curso
const checkCoursePermission = (action) => {
  return async (req, res, next) => {
    try {
      const { User } = require('../models');
      
      const user = await User.findById(req.usuario.id);
      if (!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado' });
      }
      
      // Admins podem fazer tudo
      if (user.roles?.includes('admin')) {
        return next();
      }
      
      // Verificar permissão específica
      const hasDirectPermission = user.permissions?.includes(action);
      
      if (hasDirectPermission) {
        return next();
      }
      
      // Verificar por papel
      if (user.roles && user.roles.length > 0) {
        const { Role } = require('../models');
        const userRoles = await Role.find({ name: { $in: user.roles } });
        
        for (const role of userRoles) {
          if (role.permissions?.includes(action)) {
            return next();
          }
        }
      }
      
      return res.status(403).json({ 
        msg: 'Acesso negado', 
        requiredPermission: action 
      });
    } catch (err) {
      console.error('Erro na verificação de permissões:', err);
      return res.status(500).json({ 
        msg: 'Erro ao verificar permissões',
        error: err.message 
      });
    }
  };
};

// @route   GET /api/courses
// @desc    Obter cursos com filtros
// @access  Private
router.get('/', 
  auth, 
  checkCoursePermission('courses:view'), 
  coursesController.getCourses
);

// @route   GET /api/courses/categories
// @desc    Obter categorias disponíveis
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const Course = require('../models/Course');
    
    const categories = await Course.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json(categories.map(cat => ({
      value: cat._id,
      label: cat._id,
      count: cat.count
    })));
  } catch (err) {
    console.error('Erro ao buscar categorias:', err);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// @route   GET /api/courses/my-progress
// @desc    Obter progresso dos cursos do usuário
// @access  Private
router.get('/my-progress', auth, async (req, res) => {
  try {
    const CourseProgress = require('../models/CourseProgress');
    
    const userProgress = await CourseProgress.find({ userId: req.usuario.id })
      .populate({
        path: 'courseId',
        select: 'title thumbnail category estimatedDuration',
        populate: {
          path: 'instructor',
          select: 'nome'
        }
      })
      .sort({ lastAccessedAt: -1 });
    
    res.json(userProgress);
  } catch (err) {
    console.error('Erro ao buscar progresso:', err);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// @route   POST /api/courses
// @desc    Criar novo curso
// @access  Private (Instructor/Admin)
router.post('/', 
  auth, 
  checkCoursePermission('courses:create'),
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'materials', maxCount: 10 }
  ]),
  coursesController.createCourse
);

// @route   GET /api/courses/:id
// @desc    Obter curso específico
// @access  Private
router.get('/:id', 
  auth, 
  trackLessonView,
  checkCoursePermission('courses:view'), 
  coursesController.getCourse
);

// @route   PUT /api/courses/:id
// @desc    Atualizar curso
// @access  Private (Instructor/Admin)
router.put('/:id', 
  auth,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'materials', maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const Course = require('../models/Course');
      const { User } = require('../models');
      
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ msg: 'Curso não encontrado' });
      }
      
      const user = await User.findById(req.usuario.id);
      const isInstructor = course.instructor.toString() === req.usuario.id;
      const isAdmin = user?.roles?.includes('admin') || false;
      
      if (!isInstructor && !isAdmin) {
        return res.status(403).json({ msg: 'Apenas o instrutor ou administradores podem editar este curso' });
      }
      
      // Atualizar campos
      const updateFields = { ...req.body };
      
      // Processar departamentos
      if (req.body.departamentoVisibilidade) {
        try {
          updateFields.departamentoVisibilidade = typeof req.body.departamentoVisibilidade === 'string' 
            ? JSON.parse(req.body.departamentoVisibilidade)
            : req.body.departamentoVisibilidade;
        } catch (e) {
          console.error('Erro ao processar departamentoVisibilidade:', e);
        }
      }
      
      // Atualizar thumbnail se enviada
      if (req.files && req.files.thumbnail) {
        updateFields.thumbnail = `/uploads/courses/${req.files.thumbnail[0].filename}`;
      }
      
      const updatedCourse = await Course.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true }
      ).populate('instructor', 'nome email');
      
      res.json(updatedCourse);
    } catch (err) {
      console.error('Erro ao atualizar curso:', err);
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// @route   DELETE /api/courses/:id
// @desc    Excluir curso
// @access  Private (Instructor/Admin)
router.delete('/:id', 
  auth,
  async (req, res) => {
    try {
      const Course = require('../models/Course');
      const CourseProgress = require('../models/CourseProgress');
      const { User } = require('../models');
      
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ msg: 'Curso não encontrado' });
      }
      
      const user = await User.findById(req.usuario.id);
      const isInstructor = course.instructor.toString() === req.usuario.id;
      const isAdmin = user?.roles?.includes('admin') || false;
      
      if (!isInstructor && !isAdmin) {
        return res.status(403).json({ msg: 'Apenas o instrutor ou administradores podem excluir este curso' });
      }
      
      // Remover progresso dos usuários
      await CourseProgress.deleteMany({ courseId: req.params.id });
      
      // Remover arquivos associados
      if (course.thumbnail) {
        const thumbnailPath = path.join(__dirname, '..', course.thumbnail);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }
      
      // Remover materiais das aulas
      course.lessons.forEach(lesson => {
        lesson.materials.forEach(material => {
          if (material.filePath) {
            const materialPath = path.join(__dirname, '..', material.filePath);
            if (fs.existsSync(materialPath)) {
              fs.unlinkSync(materialPath);
            }
          }
        });
      });
      
      await Course.findByIdAndDelete(req.params.id);
      
      res.json({ msg: 'Curso excluído com sucesso' });
    } catch (err) {
      console.error('Erro ao excluir curso:', err);
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// @route   POST /api/courses/:id/lessons
// @desc    Adicionar aula ao curso
// @access  Private (Instructor/Admin)
router.post('/:id/lessons', 
  auth,
  upload.array('materials', 10),
  coursesController.addLesson
);

// @route   PUT /api/courses/:courseId/lessons/:lessonId
// @desc    Atualizar aula do curso
// @access  Private (Instructor/Admin)
router.put('/:courseId/lessons/:lessonId', 
  auth,
  upload.array('materials', 10),
  async (req, res) => {
    try {
      const Course = require('../models/Course');
      const { User } = require('../models');
      
      const course = await Course.findById(req.params.courseId);
      if (!course) {
        return res.status(404).json({ msg: 'Curso não encontrado' });
      }
      
      const user = await User.findById(req.usuario.id);
      const isInstructor = course.instructor.toString() === req.usuario.id;
      const isAdmin = user?.roles?.includes('admin') || false;
      
      if (!isInstructor && !isAdmin) {
        return res.status(403).json({ msg: 'Apenas o instrutor ou administradores podem editar aulas' });
      }
      
      const lesson = course.lessons.id(req.params.lessonId);
      if (!lesson) {
        return res.status(404).json({ msg: 'Aula não encontrada' });
      }
      
      // Atualizar campos da aula
      Object.assign(lesson, req.body);
      
      // Adicionar novos materiais se enviados
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          lesson.materials.push({
            name: file.originalname,
            type: getFileType(file.mimetype),
            filePath: `/uploads/courses/materials/${file.filename}`,
            size: formatFileSize(file.size),
            order: lesson.materials.length
          });
        });
      }
      
      await course.save();
      
      res.json(course);
    } catch (err) {
      console.error('Erro ao atualizar aula:', err);
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// @route   DELETE /api/courses/:courseId/lessons/:lessonId
// @desc    Excluir aula do curso
// @access  Private (Instructor/Admin)
router.delete('/:courseId/lessons/:lessonId', 
  auth,
  async (req, res) => {
    try {
      const Course = require('../models/Course');
      const CourseProgress = require('../models/CourseProgress');
      const { User } = require('../models');
      
      const course = await Course.findById(req.params.courseId);
      if (!course) {
        return res.status(404).json({ msg: 'Curso não encontrado' });
      }
      
      const user = await User.findById(req.usuario.id);
      const isInstructor = course.instructor.toString() === req.usuario.id;
      const isAdmin = user?.roles?.includes('admin') || false;
      
      if (!isInstructor && !isAdmin) {
        return res.status(403).json({ msg: 'Apenas o instrutor ou administradores podem excluir aulas' });
      }
      
      const lesson = course.lessons.id(req.params.lessonId);
      if (!lesson) {
        return res.status(404).json({ msg: 'Aula não encontrada' });
      }
      
      // Remover arquivos de materiais
      lesson.materials.forEach(material => {
        if (material.filePath) {
          const materialPath = path.join(__dirname, '..', material.filePath);
          if (fs.existsSync(materialPath)) {
            fs.unlinkSync(materialPath);
          }
        }
      });
      
      // Remover aula
      course.lessons.pull(req.params.lessonId);
      await course.save();
      
      // Atualizar progresso dos usuários
      await CourseProgress.updateMany(
        { courseId: req.params.courseId },
        { $pull: { lessonsProgress: { lessonId: req.params.lessonId } } }
      );
      
      res.json({ msg: 'Aula excluída com sucesso' });
    } catch (err) {
      console.error('Erro ao excluir aula:', err);
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// @route   PUT /api/courses/:courseId/lessons/:lessonId/progress
// @desc    Atualizar progresso da aula
// @access  Private
router.put('/:courseId/lessons/:lessonId/progress', 
  auth, 
  trackLessonCompletion,
  coursesController.updateLessonProgress
);

// @route   POST /api/courses/:id/enroll
// @desc    Matricular-se no curso
// @access  Private
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const Course = require('../models/Course');
    const CourseProgress = require('../models/CourseProgress');
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ msg: 'Curso não encontrado' });
    }
    
    // Verificar se já está matriculado
    const existingProgress = await CourseProgress.findOne({
      userId: req.usuario.id,
      courseId: req.params.id
    });
    
    if (existingProgress) {
      return res.status(400).json({ msg: 'Usuário já matriculado neste curso' });
    }
    
    // Criar progresso
    const newProgress = new CourseProgress({
      userId: req.usuario.id,
      courseId: req.params.id,
      lessonsProgress: course.lessons.map(lesson => ({
        lessonId: lesson._id,
        completed: false,
        timeSpent: 0,
        attempts: 0
      }))
    });
    
    await newProgress.save();
    
    // Incrementar contador de matrículas
    await Course.findByIdAndUpdate(req.params.id, {
      $inc: { enrollmentCount: 1 }
    });
    
    res.json({ msg: 'Matrícula realizada com sucesso', progress: newProgress });
  } catch (err) {
    console.error('Erro ao matricular no curso:', err);
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
});

// Funções auxiliares
const getFileType = (mimetype) => {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.includes('document') || mimetype.includes('word')) return 'document';
  return 'document';
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = router;