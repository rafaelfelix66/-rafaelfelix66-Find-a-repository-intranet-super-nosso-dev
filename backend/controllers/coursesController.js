// backend/controllers/coursesController.js - CORRIGIDO
const Course = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');
const { User } = require('../models');
const path = require('path');
const fs = require('fs');

// @desc    Obter todos os cursos com filtros
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res) => {
  try {
    const { 
      search, 
      category, 
      level, 
      departamento,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    console.log('=== GET COURSES DEBUG ===');
    console.log('Query params:', req.query);
    console.log('User ID:', req.usuario.id);
    
    // Buscar dados do usuário
    const user = await User.findById(req.usuario.id);
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const userDepartment = user.departamento || 'PUBLICO';
    const isAdmin = user.roles?.includes('admin') || false;
    
    console.log('User info:', {
      id: user._id,
      departamento: userDepartment,
      isAdmin: isAdmin,
      roles: user.roles
    });
    
    // Construir filtros
    let filters = {
      isPublished: true
    };
    
    // Filtro de visibilidade por departamento
    if (!isAdmin) {
      filters.$or = [
        { departamentoVisibilidade: { $in: ['TODOS'] } },
        { departamentoVisibilidade: { $in: [userDepartment] } },
        { departamentoVisibilidade: { $exists: false } },
        { departamentoVisibilidade: { $eq: [] } }
      ];
    }
    
    // Filtros adicionais
    if (search) {
      filters.$text = { $search: search };
    }
    
    if (category && category !== 'all') {
      filters.category = category;
    }
    
    if (level && level !== 'all') {
      filters.level = level;
    }
    
    if (departamento && departamento !== 'TODOS') {
      filters.departamentoVisibilidade = { $in: [departamento] };
    }
    
    console.log('Filters applied:', JSON.stringify(filters, null, 2));
    
    // Configurar paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Configurar ordenação
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Buscar cursos
    const courses = await Course.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    console.log(`Found ${courses.length} courses`);
    
    // Buscar progresso do usuário para cada curso
    const courseIds = courses.map(course => course._id);
    const userProgress = await CourseProgress.find({
      userId: req.usuario.id,
      courseId: { $in: courseIds }
    }).lean();
    
    // Criar mapa de progresso
    const progressMap = {};
    userProgress.forEach(progress => {
      progressMap[progress.courseId.toString()] = progress;
    });
    
    // Adicionar informações de progresso aos cursos
	const coursesWithProgress = await Promise.all(
	  courses.map(async (course) => {
		// Contar matrículas reais na tabela CourseProgress
		const realEnrollmentCount = await CourseProgress.countDocuments({
		  courseId: course._id
		});
		
		const progress = progressMap[course._id.toString()];
		
		return {
		  ...course,
		  enrollmentCount: realEnrollmentCount, // Usar contador real
		  userProgress: progress ? {
			progress: progress.progress,
			status: progress.status,
			lastAccessedAt: progress.lastAccessedAt,
			enrolledAt: progress.enrolledAt
		  } : null,
		  lessonsCount: course.lessons ? course.lessons.length : 0,
		  estimatedDurationMinutes: course.estimatedDuration ? 
			parseInt(course.estimatedDuration.replace(/\D/g, '')) * 60 : 0
		};
	  })
	);
    
    // Contar total para paginação
    const total = await Course.countDocuments(filters);
    
    res.json({
      courses: coursesWithProgress,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Erro ao buscar cursos:', err);
    res.status(500).json({ 
      msg: 'Erro no servidor', 
      error: err.message 
    });
  }
};

// @desc    Obter curso específico com aulas
// @route   GET /api/courses/:id
// @access  Private
const getCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    console.log('=== GET COURSE DEBUG ===');
    console.log('Course ID:', courseId);
    console.log('User ID:', req.usuario.id);
    
    const course = await Course.findById(courseId).lean();
    
    if (!course) {
      return res.status(404).json({ msg: 'Curso não encontrado' });
    }
    
    // Verificar acesso ao curso
    const user = await User.findById(req.usuario.id);
    const userDepartment = user?.departamento || 'PUBLICO';
    const isAdmin = user?.roles?.includes('admin') || false;
    
    const hasAccess = isAdmin || 
                     course.departamentoVisibilidade.includes('TODOS') ||
                     course.departamentoVisibilidade.includes(userDepartment) ||
                     !course.departamentoVisibilidade ||
                     course.departamentoVisibilidade.length === 0;
    
    if (!hasAccess && course.isPublished) {
      console.log('Access denied to course');
      return res.status(403).json({ msg: 'Acesso negado ao curso' });
    }
    
    // Buscar progresso do usuário
    let userProgress = await CourseProgress.findOne({
      userId: req.usuario.id,
      courseId: courseId
    }).lean();
    
    // CORREÇÃO: Não criar progresso automaticamente no GET
    // Deixar isso para a rota de matrícula específica
    
    console.log('Course access granted, progress found:', !!userProgress);
    
	const realEnrollmentCount = await CourseProgress.countDocuments({
		  courseId: courseId
		});
	
    res.json({
      ...course,
	  enrollmentCount: realEnrollmentCount,
      userProgress: userProgress ? {
        progress: userProgress.progress,
        status: userProgress.status,
        lessonsProgress: userProgress.lessonsProgress,
        lastAccessedAt: userProgress.lastAccessedAt,
        enrolledAt: userProgress.enrolledAt,
        totalTimeSpent: userProgress.totalTimeSpent
      } : null
    });
  } catch (err) {
    console.error('Erro ao buscar curso:', err);
    res.status(500).json({ 
      msg: 'Erro no servidor', 
      error: err.message 
    });
  }
};

// ADICIONAR: Função para verificar se usuário está matriculado
const checkEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.usuario.id;
    
    console.log('=== CHECK ENROLLMENT ===');
    console.log('Course ID:', courseId);
    console.log('User ID:', userId);
    
    const progress = await CourseProgress.findOne({
      userId: userId,
      courseId: courseId
    });
    
    res.json({
      enrolled: !!progress,
      progress: progress || null
    });
  } catch (err) {
    console.error('Erro ao verificar matrícula:', err);
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
};

// @desc    Criar novo curso
// @route   POST /api/courses
// @access  Private (Admin)
const createCourse = async (req, res) => {
  try {
    console.log('=== CREATE COURSE DEBUG ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const {
      title,
      description,
      category,
      level,
      estimatedDuration,
      objectives,
      requirements,
      departamentoVisibilidade,
      allowDownload,
      certificateEnabled,
      passingScore,
      isPublished,
      tags
    } = req.body;
    
    // Processar departamentos
    let deptVisibilidade = ['TODOS'];
    if (departamentoVisibilidade) {
      try {
        if (typeof departamentoVisibilidade === 'string') {
          deptVisibilidade = JSON.parse(departamentoVisibilidade);
        } else if (Array.isArray(departamentoVisibilidade)) {
          deptVisibilidade = departamentoVisibilidade;
        }
      } catch (e) {
        console.error('Erro ao processar departamentoVisibilidade:', e);
      }
    }
    
    // Processar thumbnail se foi enviada
    let thumbnailPath = null;
    if (req.file) {
      thumbnailPath = `/uploads/courses/${req.file.filename}`;
    }
    
    // Criar curso (sem instrutor)
    const newCourse = new Course({
      title,
      description,
      thumbnail: thumbnailPath,
      category,
      level: level || 'Iniciante',
      estimatedDuration,
      objectives: objectives ? (Array.isArray(objectives) ? objectives : [objectives]) : [],
      requirements: requirements ? (Array.isArray(requirements) ? requirements : [requirements]) : [],
      departamentoVisibilidade: deptVisibilidade,
      allowDownload: allowDownload !== 'false',
      certificateEnabled: certificateEnabled === 'true',
      passingScore: passingScore ? parseInt(passingScore) : 70,
      isPublished: isPublished === 'true',
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      lessons: []
    });
    
    const course = await newCourse.save();
    
    console.log('Course created:', course._id);
    
    res.status(201).json(course);
  } catch (err) {
    console.error('Erro ao criar curso:', err);
    res.status(500).json({ 
      msg: 'Erro no servidor', 
      error: err.message 
    });
  }
};

// @desc    Atualizar progresso da aula
// @route   PUT /api/courses/:courseId/lessons/:lessonId/progress
// @access  Private
const updateLessonProgress = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { completed, timeSpent, score, notes, lastPosition } = req.body;
    
    console.log('=== UPDATE LESSON PROGRESS ===');
    console.log('Course ID:', courseId);
    console.log('Lesson ID:', lessonId);
    console.log('User ID:', req.usuario.id);
    console.log('Progress data:', { completed, timeSpent, score });
    
    // Buscar ou criar progresso do curso
    let courseProgress = await CourseProgress.findOne({
      userId: req.usuario.id,
      courseId: courseId
    });
    
    if (!courseProgress) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ msg: 'Curso não encontrado' });
      }
      
      courseProgress = new CourseProgress({
        userId: req.usuario.id,
        courseId: courseId,
        lessonsProgress: course.lessons.map(lesson => ({
          lessonId: lesson._id,
          completed: false,
          timeSpent: 0,
          attempts: 0
        }))
      });
    }
    
    // Atualizar progresso da aula
    let lessonProgress = courseProgress.lessonsProgress.find(
      lp => lp.lessonId.toString() === lessonId
    );
    
    if (!lessonProgress) {
      lessonProgress = {
        lessonId: lessonId,
        completed: false,
        timeSpent: 0,
        attempts: 0
      };
      courseProgress.lessonsProgress.push(lessonProgress);
    }
    
    // Atualizar campos
    if (completed !== undefined) {
      lessonProgress.completed = completed;
      if (completed) {
        lessonProgress.completedAt = new Date();
      }
    }
    
    if (timeSpent !== undefined) {
      lessonProgress.timeSpent += parseInt(timeSpent) || 0;
      courseProgress.totalTimeSpent += parseInt(timeSpent) || 0;
    }
    
    if (score !== undefined) {
      lessonProgress.score = score;
    }
    
    if (notes !== undefined) {
      lessonProgress.notes = notes;
    }
    
    if (lastPosition !== undefined) {
      lessonProgress.lastPosition = lastPosition;
    }
    
    lessonProgress.attempts += 1;
    
    // Atualizar informações gerais
    courseProgress.lastLessonId = lessonId;
    courseProgress.lastAccessedAt = new Date();
    
    // Recalcular progresso
    courseProgress.calculateProgress();
    
    await courseProgress.save();
    
    console.log('Progress updated:', {
      lessonCompleted: lessonProgress.completed,
      courseProgress: courseProgress.progress
    });
    
    res.json({
      lessonProgress: lessonProgress,
      courseProgress: courseProgress.progress,
      status: courseProgress.status
    });
  } catch (err) {
    console.error('Erro ao atualizar progresso:', err);
    res.status(500).json({ 
      msg: 'Erro no servidor', 
      error: err.message 
    });
  }
};

// @desc    Adicionar aula ao curso
// @route   POST /api/courses/:id/lessons
// @access  Private (Admin)
const addLesson = async (req, res) => {
  try {
    const courseId = req.params.id;
    const {
      title,
      description,
      type,
      content,
      videoUrl,
      duration,
      order,
      isPublished
    } = req.body;
    
    console.log('=== ADD LESSON DEBUG ===');
    console.log('Course ID:', courseId);
    console.log('Lesson data:', { title, type, order });
    console.log('Files received:', req.files);
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Curso não encontrado' });
    }
    
    // Verificar permissão (apenas admin)
    const user = await User.findById(req.usuario.id);
    const isAdmin = user?.roles?.includes('admin') || false;
    
    if (!isAdmin) {
      return res.status(403).json({ msg: 'Apenas administradores podem adicionar aulas' });
    }
    
    // Processar upload de vídeo se enviado
    let videoPath = null;
    if (req.files && req.files.videoFile && req.files.videoFile[0]) {
      videoPath = `/uploads/courses/videos/${req.files.videoFile[0].filename}`;
    }
    
    // Processar materiais se enviados
    let processedMaterials = [];
    if (req.files && req.files.materials) {
      req.files.materials.forEach((file, index) => {
        processedMaterials.push({
          name: file.originalname,
          type: getFileType(file.mimetype),
          filePath: `/uploads/courses/materials/${file.filename}`,
          size: formatFileSize(file.size),
          order: index
        });
      });
    }
    
    // Criar nova aula
    const newLesson = {
      title,
      description,
      type: type || 'video',
      content,
      videoUrl: videoPath ? '' : videoUrl, // Se tem vídeo local, limpar URL externa
      videoPath, // Caminho do vídeo local
      duration,
      order: order ? parseInt(order) : course.lessons.length + 1,
      materials: processedMaterials,
      isPublished: isPublished !== 'false'
    };
    
    course.lessons.push(newLesson);
    await course.save();
    
    const updatedCourse = await Course.findById(courseId);
    
    console.log('Lesson added to course');
    
    res.status(201).json(updatedCourse);
  } catch (err) {
    console.error('Erro ao adicionar aula:', err);
    res.status(500).json({ 
      msg: 'Erro no servidor', 
      error: err.message 
    });
  }
};

// @desc    Atualizar aula
// @route   PUT /api/courses/:courseId/lessons/:lessonId
// @access  Private (Admin)
const updateLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const {
      title,
      description,
      type,
      content,
      videoUrl,
      duration,
      order,
      isPublished
    } = req.body;
    
    console.log('=== UPDATE LESSON DEBUG ===');
    console.log('Course ID:', courseId);
    console.log('Lesson ID:', lessonId);
    console.log('Files received:', req.files);
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Curso não encontrado' });
    }
    
    // Verificar permissão (apenas admin)
    const user = await User.findById(req.usuario.id);
    const isAdmin = user?.roles?.includes('admin') || false;
    
    if (!isAdmin) {
      return res.status(403).json({ msg: 'Apenas administradores podem editar aulas' });
    }
    
    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({ msg: 'Aula não encontrada' });
    }
    
    // Atualizar campos da aula
    Object.assign(lesson, {
      title: title || lesson.title,
      description: description || lesson.description,
      type: type || lesson.type,
      content: content || lesson.content,
      videoUrl: videoUrl || lesson.videoUrl,
      duration: duration || lesson.duration,
      order: parseInt(order) || lesson.order,
      isPublished: isPublished === 'true' || isPublished === true
    });
    
    // Processar upload de vídeo se enviado
    if (req.files && req.files.videoFile && req.files.videoFile[0]) {
      lesson.videoPath = `/uploads/courses/videos/${req.files.videoFile[0].filename}`;
      // Se subiu um vídeo local, limpar a URL externa
      lesson.videoUrl = '';
    }
    
    // Adicionar novos materiais se enviados
    if (req.files && req.files.materials) {
      req.files.materials.forEach(file => {
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
};

// @desc    Excluir aula
// @route   DELETE /api/courses/:courseId/lessons/:lessonId
// @access  Private (Admin)
const deleteLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Curso não encontrado' });
    }
    
    // Verificar permissão (apenas admin)
    const user = await User.findById(req.usuario.id);
    const isAdmin = user?.roles?.includes('admin') || false;
    
    if (!isAdmin) {
      return res.status(403).json({ msg: 'Apenas administradores podem excluir aulas' });
    }
    
    const lesson = course.lessons.id(lessonId);
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
    
    // Remover vídeo se existir
    if (lesson.videoPath) {
      const videoPath = path.join(__dirname, '..', lesson.videoPath);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }
    
    // Remover aula
    course.lessons.pull(lessonId);
    await course.save();
    
    // Atualizar progresso dos usuários
    const CourseProgress = require('../models/CourseProgress');
    await CourseProgress.updateMany(
      { courseId: courseId },
      { $pull: { lessonsProgress: { lessonId: lessonId } } }
    );
    
    res.json({ msg: 'Aula excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir aula:', err);
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
};

// @desc    Excluir curso
// @route   DELETE /api/courses/:id
// @access  Private (Admin)
const deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Curso não encontrado' });
    }
    
    // Verificar permissão (apenas admin)
    const user = await User.findById(req.usuario.id);
    const isAdmin = user?.roles?.includes('admin') || false;
    
    if (!isAdmin) {
      return res.status(403).json({ msg: 'Apenas administradores podem excluir cursos' });
    }
    
    // Remover progresso dos usuários
    const CourseProgress = require('../models/CourseProgress');
    await CourseProgress.deleteMany({ courseId: courseId });
    
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
      
      // Remover vídeos das aulas
      if (lesson.videoPath) {
        const videoPath = path.join(__dirname, '..', lesson.videoPath);
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
      }
    });
    
    await Course.findByIdAndDelete(courseId);
    
    res.json({ msg: 'Curso excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir curso:', err);
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
};

// @desc    Atualizar curso
// @route   PUT /api/courses/:id
// @access  Private (Admin)
const updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Curso não encontrado' });
    }
    
    // Verificar permissão (apenas admin)
    const user = await User.findById(req.usuario.id);
    const isAdmin = user?.roles?.includes('admin') || false;
    
    if (!isAdmin) {
      return res.status(403).json({ msg: 'Apenas administradores podem editar cursos' });
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
    if (req.file) {
      updateFields.thumbnail = `/uploads/courses/${req.file.filename}`;
    }
    
    // Converter strings booleanas
    ['isPublished', 'allowDownload', 'certificateEnabled'].forEach(field => {
      if (updateFields[field] !== undefined) {
        updateFields[field] = updateFields[field] === 'true' || updateFields[field] === true;
      }
    });
    
    // Converter números
    if (updateFields.passingScore) {
      updateFields.passingScore = parseInt(updateFields.passingScore) || 70;
    }
    
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { $set: updateFields },
      { new: true }
    );
    
    res.json(updatedCourse);
  } catch (err) {
    console.error('Erro ao atualizar curso:', err);
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
};

// @desc    Obter lista de alunos matriculados em um curso
// @route   GET /api/courses/:id/enrolled-students
// @access  Private (Admin ou Instrutor)
const getEnrolledStudents = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { page = 1, limit = 50 } = req.query;
    
    console.log('=== GET ENROLLED STUDENTS ===');
    console.log('Course ID:', courseId);
    console.log('User ID:', req.usuario.id);
    
    // Verificar se o curso existe
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Curso não encontrado' });
    }
    
    // Verificar se o usuário tem permissão para ver a lista
    const user = await User.findById(req.usuario.id);
    const isAdmin = user?.roles?.includes('admin') || false;
    const isInstructor = course.instructor && course.instructor.toString() === req.usuario.id;
    
    if (!isAdmin && !isInstructor) {
      return res.status(403).json({ msg: 'Acesso negado. Apenas administradores ou instrutores podem ver a lista de alunos.' });
    }
    
    // Configurar paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Buscar progresso de todos os usuários matriculados no curso
    const enrolledStudents = await CourseProgress.find({
      courseId: courseId
    })
    .populate({
      path: 'userId',
      select: 'nome email departamento avatar createdAt',
      model: 'User'
    })
    .sort({ enrolledAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();
    
    // Contar total de matriculados
    const totalEnrolled = await CourseProgress.countDocuments({
      courseId: courseId
    });
    
    // Formatar dados dos estudantes
    const studentsData = enrolledStudents.map(enrollment => ({
      _id: enrollment.userId._id,
      nome: enrollment.userId.nome,
      email: enrollment.userId.email,
      departamento: enrollment.userId.departamento,
      avatar: enrollment.userId.avatar,
      enrolledAt: enrollment.enrolledAt,
      progress: enrollment.progress,
      status: enrollment.status,
      lastAccessedAt: enrollment.lastAccessedAt,
      totalTimeSpent: enrollment.totalTimeSpent,
      completedLessons: enrollment.lessonsProgress ? 
        enrollment.lessonsProgress.filter(lp => lp.completed).length : 0,
      totalLessons: course.lessons ? course.lessons.length : 0
    }));
    
    res.json({
      course: {
        _id: course._id,
        title: course.title,
        totalLessons: course.lessons ? course.lessons.length : 0
      },
      students: studentsData,
      totalEnrolled,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: totalEnrolled,
        pages: Math.ceil(totalEnrolled / parseInt(limit))
      }
    });
    
  } catch (err) {
    console.error('Erro ao buscar alunos matriculados:', err);
    res.status(500).json({ 
      msg: 'Erro no servidor', 
      error: err.message 
    });
  }
};

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

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  updateLessonProgress,
  addLesson,
  updateLesson,
  deleteLesson,
  checkEnrollment,
  getEnrolledStudents 
};