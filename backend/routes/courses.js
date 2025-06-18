// backend/routes/courses.js - ARQUIVO COMPLETO
const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');
const { getEnrolledStudents } = require('../controllers/coursesController');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/permissions');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Importar o middleware de rastreamento de engajamento
const { trackLessonView, trackLessonCompletion } = require('../middleware/trackEngagement');

// Garantir que os diretórios de uploads existam
const uploadsDir = path.join(__dirname, '../uploads/courses');
const materialsDir = path.join(__dirname, '../uploads/courses/materials');
const videosDir = path.join(__dirname, '../uploads/courses/videos');

[uploadsDir, materialsDir, videosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuração do multer para uploads de cursos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
      cb(null, uploadsDir);
    } else if (file.fieldname === 'videoFile') {
      cb(null, videosDir);
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

// Filtro de arquivos melhorado
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
  } else if (file.fieldname === 'videoFile') {
    // Para vídeos
    const allowedTypes = /mp4|avi|mov|webm|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('video/');
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Apenas vídeos são permitidos'), false);
  } else if (file.fieldname === 'materials') {
    // Para materiais, vários tipos de arquivo
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|mp4|mp3|avi|mov|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Tipo de arquivo não suportado'), false);
  } else {
    cb(new Error('Campo de upload não reconhecido'), false);
  }
};

// Configuração específica para cada rota
const uploadCourse = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB para thumbnails
  }
}).single('thumbnail');

const uploadLesson = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB para vídeos
  }
}).fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'videoFile', maxCount: 1 },
  { name: 'materials', maxCount: 10 }
]);

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

// @route   GET /api/courses/:courseId/enrollment
// @desc    Verificar se usuário está matriculado no curso
// @access  Private
router.get('/:courseId/enrollment', 
  auth, 
  coursesController.checkEnrollment
);

// @route   GET /api/courses/:id/enrolled-students
// @desc    Listar alunos matriculados em um curso
// @access  Private (Admin ou Instrutor)
router.get('/:id/enrolled-students', auth, getEnrolledStudents);


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
        select: 'title thumbnail category estimatedDuration'
      })
      .sort({ lastAccessedAt: -1 });
    
    res.json(userProgress);
  } catch (err) {
    console.error('Erro ao buscar progresso:', err);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// @route   GET /api/courses/admin/all
// @desc    Obter todos os cursos para administradores (incluindo não publicados)
// @access  Private (Admin)
router.get('/admin/all', 
  auth,
  checkCoursePermission('courses:admin'),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const Course = require('../models/Course');
      const courses = await Course.find({})
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      const total = await Course.countDocuments({});
      
      res.json({
        courses,
        pagination: {
          current: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (err) {
      console.error('Erro ao buscar todos os cursos:', err);
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// @route   GET /api/courses/stats
// @desc    Obter estatísticas dos cursos
// @access  Private (Admin)
router.get('/stats', 
  auth,
  checkCoursePermission('courses:view_analytics'),
  async (req, res) => {
    try {
      const Course = require('../models/Course');
      const CourseProgress = require('../models/CourseProgress');
      
      // Estatísticas básicas
      const totalCourses = await Course.countDocuments({});
      const publishedCourses = await Course.countDocuments({ isPublished: true });
      const totalEnrollments = await CourseProgress.countDocuments({});
      
      // Cursos mais populares
      const popularCourses = await Course.find({ isPublished: true })
        .sort({ enrollmentCount: -1 })
        .limit(5)
        .select('title enrollmentCount');
      
      // Estatísticas por categoria
      const categoryStats = await Course.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$category', count: { $sum: 1 }, enrollments: { $sum: '$enrollmentCount' } } },
        { $sort: { count: -1 } }
      ]);
      
      // Taxa de conclusão geral
      const completionStats = await CourseProgress.aggregate([
        { $group: { 
          _id: null, 
          totalProgress: { $avg: '$progress' },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          notStarted: { $sum: { $cond: [{ $eq: ['$status', 'not_started'] }, 1, 0] } }
        }}
      ]);
      
      res.json({
        overview: {
          totalCourses,
          publishedCourses,
          totalEnrollments,
          averageProgress: completionStats[0]?.totalProgress || 0
        },
        popularCourses,
        categoryStats,
        completionStats: completionStats[0] || { completed: 0, inProgress: 0, notStarted: 0 }
      });
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// @route   POST /api/courses
// @desc    Criar novo curso
// @access  Private (Admin)
router.post('/', 
  auth, 
  checkCoursePermission('courses:create'),
  (req, res, next) => {
    uploadCourse(req, res, (err) => {
      if (err) {
        console.error('Erro no upload do thumbnail:', err);
        return res.status(400).json({ msg: 'Erro no upload: ' + err.message });
      }
      next();
    });
  },
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
// @access  Private (Admin)
router.put('/:id', 
  auth,
  checkCoursePermission('courses:edit_any'),
  (req, res, next) => {
    uploadCourse(req, res, (err) => {
      if (err) {
        console.error('Erro no upload do thumbnail:', err);
        return res.status(400).json({ msg: 'Erro no upload: ' + err.message });
      }
      next();
    });
  },
  coursesController.updateCourse
);

// @route   DELETE /api/courses/:id
// @desc    Excluir curso
// @access  Private (Admin)
router.delete('/:id', 
  auth,
  checkCoursePermission('courses:delete_any'),
  coursesController.deleteCourse
);

// @route   POST /api/courses/:id/publish
// @desc    Publicar/despublicar curso
// @access  Private (Admin)
router.post('/:id/publish', 
  auth,
  checkCoursePermission('courses:edit_any'),
  async (req, res) => {
    try {
      const { isPublished } = req.body;
      
      const Course = require('../models/Course');
      const course = await Course.findByIdAndUpdate(
        req.params.id,
        { isPublished: isPublished },
        { new: true }
      );
      
      if (!course) {
        return res.status(404).json({ msg: 'Curso não encontrado' });
      }
      
      res.json({ 
        msg: `Curso ${isPublished ? 'publicado' : 'despublicado'} com sucesso`,
        course 
      });
    } catch (err) {
      console.error('Erro ao publicar/despublicar curso:', err);
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// @route   POST /api/courses/:id/duplicate
// @desc    Duplicar curso
// @access  Private (Admin)
router.post('/:id/duplicate', 
  auth,
  checkCoursePermission('courses:create'),
  async (req, res) => {
    try {
      const Course = require('../models/Course');
      const originalCourse = await Course.findById(req.params.id).lean();
      
      if (!originalCourse) {
        return res.status(404).json({ msg: 'Curso não encontrado' });
      }
      
      // Criar cópia do curso
      const duplicatedCourse = {
        ...originalCourse,
        _id: undefined, // Remove o ID para criar um novo
        title: `${originalCourse.title} (Cópia)`,
        isPublished: false, // Sempre criar como rascunho
        enrollmentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lessons: originalCourse.lessons.map(lesson => ({
          ...lesson,
          _id: undefined, // Remove IDs das aulas também
          materials: lesson.materials.map(material => ({
            ...material,
            _id: undefined // Remove IDs dos materiais
          }))
        }))
      };
      
      const newCourse = new Course(duplicatedCourse);
      await newCourse.save();
      
      res.status(201).json({
        msg: 'Curso duplicado com sucesso',
        course: newCourse
      });
    } catch (err) {
      console.error('Erro ao duplicar curso:', err);
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// CORREÇÃO COMPLETA da rota de matrícula
// @route   POST /api/courses/:id/enroll
// @desc    Matricular-se no curso
// @access  Private
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    console.log('=== MATRÍCULA COMPLETA DEBUG ===');
    console.log('Course ID:', req.params.id);
    console.log('User ID:', req.usuario.id);
    console.log('Request body:', req.body);
    
    const Course = require('../models/Course');
    const CourseProgress = require('../models/CourseProgress');
    const { User } = require('../models');
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      console.log('Curso não encontrado');
      return res.status(404).json({ msg: 'Curso não encontrado' });
    }
    
    console.log('Curso encontrado:', course.title);
    
    // Verificar se o curso está publicado
    if (!course.isPublished) {
      console.log('Curso não está publicado');
      return res.status(400).json({ msg: 'Este curso não está disponível para matrícula' });
    }
    
    // Verificar acesso por departamento
    const user = await User.findById(req.usuario.id);
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const userDepartment = user.departamento || 'PUBLICO';
    const isAdmin = user.roles?.includes('admin') || false;
    
    console.log('Dados do usuário:', {
      id: user._id,
      nome: user.nome,
      departamento: userDepartment,
      isAdmin: isAdmin
    });
    
    const hasAccess = isAdmin || 
                     course.departamentoVisibilidade.includes('TODOS') ||
                     course.departamentoVisibilidade.includes(userDepartment) ||
                     !course.departamentoVisibilidade ||
                     course.departamentoVisibilidade.length === 0;
    
    console.log('Verificação de acesso:', {
      hasAccess,
      courseVisibility: course.departamentoVisibilidade,
      userDepartment
    });
    
    if (!hasAccess) {
      console.log('Usuário não tem acesso ao curso');
      return res.status(403).json({ msg: 'Você não tem acesso a este curso' });
    }
    
    // Verificar se já está matriculado
    const existingProgress = await CourseProgress.findOne({
      userId: req.usuario.id,
      courseId: req.params.id
    });
    
    if (existingProgress) {
      console.log('Usuário já matriculado, retornando progresso existente');
      return res.json({ 
        msg: 'Você já está matriculado neste curso',
        progress: existingProgress,
        alreadyEnrolled: true,
        enrollmentCount: course.enrollmentCount
      });
    }
    
    // Criar progresso inicial para todas as aulas
    const lessonsProgress = course.lessons.map(lesson => ({
      lessonId: lesson._id,
      completed: false,
      timeSpent: 0,
      attempts: 0
    }));
    
    console.log('Criando progresso para', lessonsProgress.length, 'aulas');
    
    const newProgress = new CourseProgress({
      userId: req.usuario.id,
      courseId: req.params.id,
      lessonsProgress: lessonsProgress,
      enrolledAt: new Date(),
      status: 'not_started',
      progress: 0,
      totalTimeSpent: 0
    });
    
    const savedProgress = await newProgress.save();
    console.log('Progresso criado com ID:', savedProgress._id);
    
    // Incrementar contador de matrículas usando findByIdAndUpdate para garantir atomicidade
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id, 
      { $inc: { enrollmentCount: 1 } },
      { new: true, select: 'enrollmentCount title' }
    );
    
    console.log('Contador de matrículas atualizado:', {
      courseTitle: updatedCourse.title,
      newCount: updatedCourse.enrollmentCount
    });
    
    res.json({ 
      msg: 'Matrícula realizada com sucesso', 
      progress: savedProgress,
      enrollmentCount: updatedCourse.enrollmentCount,
      course: {
        _id: course._id,
        title: course.title
      }
    });
    
  } catch (err) {
    console.error('Erro completo ao matricular no curso:', err);
    res.status(500).json({ 
      msg: 'Erro no servidor', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   POST /api/courses/:id/lessons
// @desc    Adicionar aula ao curso
// @access  Private (Admin)
router.post('/:id/lessons', 
  auth,
  checkCoursePermission('courses:manage_lessons'),
  (req, res, next) => {
    uploadLesson(req, res, (err) => {
      if (err) {
        console.error('Erro no upload da aula:', err);
        return res.status(400).json({ msg: 'Erro no upload: ' + err.message });
      }
      next();
    });
  },
  coursesController.addLesson
);

// @route   PUT /api/courses/:courseId/lessons/:lessonId
// @desc    Atualizar aula do curso
// @access  Private (Admin)
router.put('/:courseId/lessons/:lessonId', 
  auth,
  checkCoursePermission('courses:manage_lessons'),
  (req, res, next) => {
    uploadLesson(req, res, (err) => {
      if (err) {
        console.error('Erro no upload da aula:', err);
        return res.status(400).json({ msg: 'Erro no upload: ' + err.message });
      }
      next();
    });
  },
  coursesController.updateLesson
);

// @route   DELETE /api/courses/:courseId/lessons/:lessonId
// @desc    Excluir aula do curso
// @access  Private (Admin)
router.delete('/:courseId/lessons/:lessonId', 
  auth,
  checkCoursePermission('courses:manage_lessons'),
  coursesController.deleteLesson
);

// @route   PUT /api/courses/:courseId/lessons/:lessonId/progress
// @desc    Atualizar progresso da aula
// @access  Private
router.put('/:courseId/lessons/:lessonId/progress', 
  auth, 
  trackLessonCompletion,
  coursesController.updateLessonProgress
);

// @route   GET /api/courses/:courseId/lessons/:lessonId/materials
// @desc    Obter materiais de uma aula específica
// @access  Private
router.get('/:courseId/lessons/:lessonId/materials', auth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    
    const Course = require('../models/Course');
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ msg: 'Curso não encontrado' });
    }
    
    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({ msg: 'Aula não encontrada' });
    }
    
    // Verificar acesso ao curso
    const { User } = require('../models');
    const user = await User.findById(req.usuario.id);
    const userDepartment = user?.departamento || 'PUBLICO';
    const isAdmin = user?.roles?.includes('admin') || false;
    
    const hasAccess = isAdmin || 
                     course.departamentoVisibilidade.includes('TODOS') ||
                     course.departamentoVisibilidade.includes(userDepartment);
    
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Acesso negado ao curso' });
    }
    
    res.json(lesson.materials || []);
  } catch (err) {
    console.error('Erro ao buscar materiais da aula:', err);
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
});

// Configuração de storage específica para materiais
const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, materialsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `material-${uniqueSuffix}${ext}`);
  }
});

// Filtro de arquivos específico para materiais
const materialFileFilter = (req, file, cb) => {
  console.log('Validando arquivo de material:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });
  
  // Aceitar vários tipos de arquivo para materiais
  const allowedExtensions = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|mp4|mp3|avi|mov|txt|zip|rar/i;
  const extname = allowedExtensions.test(path.extname(file.originalname));
  
  if (extname) {
    return cb(null, true);
  }
  
  console.error('Tipo de arquivo não permitido:', file.originalname);
  cb(new Error('Tipo de arquivo não suportado para materiais'), false);
};

// Configuração do multer para materiais
const uploadMaterials = multer({
  storage: materialStorage,
  fileFilter: materialFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
}).single('material');

// @route   POST /api/courses/:courseId/lessons/:lessonId/materials
// @desc    Adicionar material a uma aula
// @access  Private (Admin)
router.post('/:courseId/lessons/:lessonId/materials', 
  auth,
  checkCoursePermission('courses:manage_materials'),
  (req, res, next) => {
    console.log('=== UPLOAD MATERIAL DEBUG ===');
    console.log('Headers:', req.headers['content-type']);
    console.log('Body antes do upload:', req.body);
    
    uploadMaterials(req, res, (err) => {
      if (err) {
        console.error('Erro no multer:', {
          message: err.message,
          code: err.code,
          field: err.field
        });
        return res.status(400).json({ 
          msg: 'Erro no upload: ' + err.message,
          error: err.code
        });
      }
      
      console.log('Multer processado com sucesso:', {
        file: req.file ? {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size
        } : null,
        body: req.body
      });
      
      next();
    });
  },
  async (req, res) => {
    try {
      const { courseId, lessonId } = req.params;
      const { name, type, url, description } = req.body;
      
      console.log('=== ADD MATERIAL CONTROLLER ===');
      console.log('Course ID:', courseId);
      console.log('Lesson ID:', lessonId);
      console.log('Body:', req.body);
      console.log('File:', req.file);
      
      const Course = require('../models/Course');
      const course = await Course.findById(courseId);
      
      if (!course) {
        return res.status(404).json({ msg: 'Curso não encontrado' });
      }
      
      const lesson = course.lessons.id(lessonId);
      if (!lesson) {
        return res.status(404).json({ msg: 'Aula não encontrada' });
      }
      
      let newMaterial = {
        name: name || (req.file ? req.file.originalname : 'Material sem nome'),
        type: type || 'document',
        description: description || '',
        order: lesson.materials.length
      };
      
      // Verificar se é arquivo ou URL
      if (req.file) {
        newMaterial.filePath = `/uploads/courses/materials/${req.file.filename}`;
        newMaterial.size = formatFileSize(req.file.size);
        newMaterial.type = getFileType(req.file.mimetype);
        
        console.log('Arquivo processado:', {
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: newMaterial.filePath,
          size: newMaterial.size,
          type: newMaterial.type
        });
      }
      else if (url) {
        newMaterial.url = url;
        newMaterial.type = 'link';
        console.log('URL processada:', url);
      }
      else {
        return res.status(400).json({ 
          msg: 'É necessário enviar um arquivo ou fornecer uma URL',
          received: {
            hasFile: !!req.file,
            hasUrl: !!url,
            body: req.body
          }
        });
      }
      
      // Adicionar o material à aula
      lesson.materials.push(newMaterial);
      await course.save();
      
      console.log('Material adicionado com sucesso:', newMaterial);
      
      // Retornar o material criado
      const savedMaterial = lesson.materials[lesson.materials.length - 1];
      
      res.status(201).json({
        msg: 'Material adicionado com sucesso',
        material: savedMaterial
      });
    } catch (err) {
      console.error('Erro ao adicionar material:', err);
      res.status(500).json({ 
        msg: 'Erro no servidor', 
        error: err.message 
      });
    }
  }
);

// @route   DELETE /api/courses/:courseId/lessons/:lessonId/materials/:materialId
// @desc    Remover material de uma aula
// @access  Private (Admin)
router.delete('/:courseId/lessons/:lessonId/materials/:materialId', 
  auth,
  checkCoursePermission('courses:manage_materials'),
  async (req, res) => {
    try {
      const { courseId, lessonId, materialId } = req.params;
      
      const Course = require('../models/Course');
      const course = await Course.findById(courseId);
      
      if (!course) {
        return res.status(404).json({ msg: 'Curso não encontrado' });
      }
      
      const lesson = course.lessons.id(lessonId);
      if (!lesson) {
        return res.status(404).json({ msg: 'Aula não encontrada' });
      }
      
      const material = lesson.materials.id(materialId);
      if (!material) {
        return res.status(404).json({ msg: 'Material não encontrado' });
      }
      
      // Remover arquivo físico se existir
      if (material.filePath) {
        const filePath = path.join(__dirname, '..', material.filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // Remover material da aula
      lesson.materials.pull(materialId);
      await course.save();
      
      res.json({ msg: 'Material removido com sucesso' });
    } catch (err) {
      console.error('Erro ao remover material:', err);
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);


// @route   GET /api/courses/:courseId/materials/:materialId/download
// @desc    Download de material da aula - VERSÃO CORRIGIDA
// @access  Private
router.get('/:courseId/materials/:materialId/download', auth, async (req, res) => {
  try {
    const { courseId, materialId } = req.params;
    
    console.log('=== DOWNLOAD MATERIAL DEBUG ===');
    console.log('Course ID:', courseId);
    console.log('Material ID:', materialId);
    
    const Course = require('../models/Course');
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ msg: 'Curso não encontrado' });
    }
    
    // Encontrar o material em qualquer aula do curso
    let material = null;
    let lesson = null;
    
    for (const l of course.lessons) {
      const foundMaterial = l.materials.find(m => {
        const materialIdStr = m._id ? m._id.toString() : null;
        return materialIdStr === materialId;
      });
      
      if (foundMaterial) {
        material = foundMaterial;
        lesson = l;
        break;
      }
    }
    
    if (!material) {
      return res.status(404).json({ msg: 'Material não encontrado' });
    }
    
    // Verificar acesso ao curso
    const { User } = require('../models');
    const user = await User.findById(req.usuario.id);
    const userDepartment = user?.departamento || 'PUBLICO';
    const isAdmin = user?.roles?.includes('admin') || false;
    
    const hasAccess = isAdmin || 
                     course.departamentoVisibilidade.includes('TODOS') ||
                     course.departamentoVisibilidade.includes(userDepartment) ||
                     !course.departamentoVisibilidade ||
                     course.departamentoVisibilidade.length === 0;
    
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Acesso negado ao curso' });
    }
    
    // Verificar se o download é permitido
    if (!course.allowDownload && !isAdmin) {
      return res.status(403).json({ msg: 'Download não permitido para este curso' });
    }
    
    // Se é um link externo, redirecionar
    if (material.url) {
      return res.redirect(material.url);
    }
    
    // Se é um arquivo local, servir o arquivo
    if (material.filePath) {
      const filePath = path.join(__dirname, '..', material.filePath);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ msg: 'Arquivo não encontrado no servidor' });
      }
      
      // FUNÇÃO CORRIGIDA para garantir extensão
      const getFileNameWithExtension = (materialName, filePath) => {
        console.log('=== PROCESSANDO NOME DO ARQUIVO ===');
        console.log('Material name:', materialName);
        console.log('File path:', filePath);
        
        // Se não tem nome do material, usar o nome do arquivo físico
        if (!materialName) {
          const result = path.basename(filePath);
          console.log('Usando nome do arquivo físico:', result);
          return result;
        }
        
        // Obter extensões
        const fileExtension = path.extname(filePath).toLowerCase();
        const materialExtension = path.extname(materialName).toLowerCase();
        
        console.log('File extension:', fileExtension);
        console.log('Material extension:', materialExtension);
        
        // Se o nome do material já tem a mesma extensão, usar como está
        if (materialExtension && materialExtension === fileExtension) {
          console.log('Material já tem extensão correta:', materialName);
          return materialName;
        }
        
        // Se o nome do material não tem extensão, adicionar a do arquivo
        if (!materialExtension && fileExtension) {
          const result = materialName + fileExtension;
          console.log('Adicionando extensão ao material:', result);
          return result;
        }
        
        // Se o nome do material tem extensão diferente, corrigir
        if (materialExtension && materialExtension !== fileExtension) {
          const nameWithoutExt = path.parse(materialName).name;
          const result = nameWithoutExt + fileExtension;
          console.log('Corrigindo extensão do material:', result);
          return result;
        }
        
        // Fallback
        const result = materialName || path.basename(filePath);
        console.log('Usando fallback:', result);
        return result;
      };
      
      const stats = fs.statSync(filePath);
      const filename = getFileNameWithExtension(material.name, filePath);
      
      console.log('=== ARQUIVO FINAL ===');
      console.log('Filename que será baixado:', filename);
      
      // Definir headers apropriados
       // Função para detectar MIME type correto
            const getMimeType = (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.xls': 'application/vnd.ms-excel',
          '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '.ppt': 'application/vnd.ms-powerpoint',
          '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.mp4': 'video/mp4',
          '.mp3': 'audio/mpeg',
          '.txt': 'text/plain',
          '.zip': 'application/zip',
          '.rar': 'application/x-rar-compressed'
        };
        return mimeTypes[ext] || 'application/octet-stream';
      };
      
      const mimeType = getMimeType(filePath);
      console.log('MIME Type detectado:', mimeType);
      
      // Definir headers com múltiplos formatos para compatibilidade
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      console.log('=== HEADERS DEFINIDOS ===');
      console.log('Content-Type:', mimeType);
      console.log('Content-Disposition:', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
      console.log('Content-Length:', stats.size);
      
      // Criar stream de leitura para controle total
      const stream = fs.createReadStream(filePath);
      
      stream.on('error', (err) => {
        console.error('Erro no stream:', err);
        if (!res.headersSent) {
          res.status(500).json({ msg: 'Erro ao enviar arquivo' });
        }
      });
      
      stream.on('end', () => {
        console.log(`Download concluído via stream: ${filename} (${mimeType})`);
      });
      
      // Pipe do stream para a resposta
      stream.pipe(res);
      
    } else {
      return res.status(404).json({ msg: 'Material não possui arquivo ou URL' });
    }
    
  } catch (err) {
    console.error('Erro ao fazer download do material:', err);
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
});


// Rota alternativa para compatibilidade
router.get('/:courseId/lessons/:lessonId/materials/:materialId/download', auth, async (req, res) => {
  try {
    const { courseId, lessonId, materialId } = req.params;
    
    const Course = require('../models/Course');
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ msg: 'Curso não encontrado' });
    }
    
    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({ msg: 'Aula não encontrada' });
    }
    
    const material = lesson.materials.id(materialId);
    if (!material) {
      return res.status(404).json({ msg: 'Material não encontrado' });
    }
    
    // Verificar acesso
    const { User } = require('../models');
    const user = await User.findById(req.usuario.id);
    const userDepartment = user?.departamento || 'PUBLICO';
    const isAdmin = user?.roles?.includes('admin') || false;
    
    const hasAccess = isAdmin || 
                     course.departamentoVisibilidade.includes('TODOS') ||
                     course.departamentoVisibilidade.includes(userDepartment);
    
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Acesso negado ao curso' });
    }
    
    if (!course.allowDownload && !isAdmin) {
      return res.status(403).json({ msg: 'Download não permitido para este curso' });
    }
    
    // Servir arquivo
    if (material.url) {
      return res.redirect(material.url);
    }
    
    if (material.filePath) {
      const filePath = path.join(__dirname, '..', material.filePath);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ msg: 'Arquivo não encontrado' });
      }
      
      // MESMA FUNÇÃO para garantir extensão
      const getFileNameWithExtension = (materialName, filePath) => {
        if (!materialName) {
          return path.basename(filePath);
        }
        
        const fileExtension = path.extname(filePath).toLowerCase();
        const materialExtension = path.extname(materialName).toLowerCase();
        
        if (materialExtension && materialExtension === fileExtension) {
          return materialName;
        }
        
        if (!materialExtension && fileExtension) {
          return materialName + fileExtension;
        }
        
        if (materialExtension && materialExtension !== fileExtension) {
          const nameWithoutExt = path.parse(materialName).name;
          return nameWithoutExt + fileExtension;
        }
        
        return materialName || path.basename(filePath);
      };
      
      const filename = getFileNameWithExtension(material.name, filePath);
      const mimeType = getMimeType(filePath);
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.sendFile(filePath);
    } else {
      return res.status(404).json({ msg: 'Material não possui arquivo' });
    }
    
  } catch (err) {
    console.error('Erro no download:', err);
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