import React, { useState, useCallback, useEffect } from 'react';
import { api } from '@/services/api';
import { downloadService } from '@/services/downloadService';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/usePermission'; // ADICIONADO
import { 
  BookOpen, 
  FileText, 
  Link2, 
  Image, 
  Download, 
  CheckCircle, 
  Clock, 
  Users, 
  Search,
  Grid,
  List,
  ArrowLeft,
  Plus,
  Upload,
  X,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Settings,
  Lock 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';

// Importar os componentes separados
import VideoPlayer from './VideoPlayer';
import CreateCourseDialog from './CreateCourseDialog';
import CreateLessonDialog from './CreateLessonDialog';
import AddMaterialDialog from './AddMaterialDialog';

const EADPage = () => {
  const { toast } = useToast();
  const { hasPermission } = usePermission(); // ADICIONADO
  
  // Verificar permissões
  const canManageCourses = hasPermission('courses:create') || hasPermission('courses:admin');
  const canManageLessons = hasPermission('courses:manage_lessons') || hasPermission('courses:admin');
  const canManageMaterials = hasPermission('courses:manage_materials') || hasPermission('courses:admin');
  
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para criação/edição
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  
  // Estados do formulário
  const [courseForm, setCourseForm] = useState({
    _id: '',
    title: '',
    description: '',
    category: '',
    level: 'Iniciante',
    estimatedDuration: '',
    departamentoVisibilidade: ['TODOS'],
    allowDownload: true,
    certificateEnabled: false,
    passingScore: 70,
    isPublished: false,
    thumbnail: null,
    currentThumbnail: ''
  });
  
  const [lessonForm, setLessonForm] = useState({
    _id: '',
    title: '',
    description: '',
    type: 'video',
    content: '',
    videoUrl: '',
    videoFile: null,
    duration: '',
    order: 1,
    isPublished: true,
    materials: []
  });

  const [materialForm, setMaterialForm] = useState({
    name: '',
    type: 'pdf',
    file: null,
    url: ''
  });

  // Carregar cursos da API
  const fetchCourses = useCallback(async () => {
  try {
    setIsLoading(true);
    const response = await api.get('/courses');
    console.log('=== CURSOS CARREGADOS ===');
    console.log('Response:', response);
    
    let coursesList = [];
    
    if (response.courses) {
      coursesList = response.courses;
    } else if (Array.isArray(response)) {
      coursesList = response;
    }
    
    console.log('Lista de cursos processada:', coursesList.length, 'cursos');
    
    // Log dos contadores de matrícula
    coursesList.forEach(course => {
      console.log(`Curso: ${course.title} - Matrículas: ${course.enrollmentCount || 0}`);
    });
    
    setCourses(coursesList);
  } catch (error) {
    console.error('Erro ao carregar cursos:', error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os cursos",
      variant: "destructive"
    });
    setCourses([]);
  } finally {
    setIsLoading(false);
  }
}, [toast]);

  // Carregar curso específico
  const fetchCourse = async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      setSelectedCourse(response);
      return response;
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o curso",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    fetchCourses();
  }, []);
  
  // Handler para matrícula no curso - VERSÃO FINAL CORRIGIDA
	// Handler para matrícula EXPLÍCITA - permanece igual
		const handleEnrollCourse = useCallback(async (course) => {
		  try {
			console.log('=== MATRÍCULA EXPLÍCITA SOLICITADA ===');
			console.log('Curso:', course.title);
			console.log('ID do curso:', course._id);
			
			setIsLoading(true);
			
			const response = await api.post(`/courses/${course._id}/enroll`, {});
			
			console.log('=== RESPOSTA DA MATRÍCULA ===');
			console.log('Response completa:', response);
			console.log('Já matriculado?', response.alreadyEnrolled);
			console.log('Novo contador:', response.enrollmentCount);
			
			if (response.alreadyEnrolled) {
			  toast({
				title: "Já matriculado",
				description: `Você já está matriculado no curso "${course.title}"`,
				variant: "default"
			  });
			} else {
			  toast({
				title: "Matrícula realizada!",
				description: `Você foi matriculado no curso "${course.title}"`,
				variant: "default"
			  });
			}
			
			// Recarregar o curso para mostrar o progresso atualizado
			const courseData = await fetchCourse(course._id);
			if (courseData) {
			  console.log('Curso recarregado com progresso:', courseData.userProgress);
			  setSelectedCourse(courseData);
			}
			
			// Recarregar lista de cursos para atualizar contadores
			await fetchCourses();
			
		  } catch (error) {
			console.error('=== ERRO NA MATRÍCULA ===');
			console.error('Erro completo:', error);
			
			if (error.message && error.message.includes('400')) {
			  console.log('Erro 400 - tentando carregar curso mesmo assim');
			  try {
				const courseData = await fetchCourse(course._id);
				if (courseData && courseData.userProgress) {
				  setSelectedCourse(courseData);
				  toast({
					title: "Curso já acessível",
					description: "Você já tem acesso a este curso",
					variant: "default"
				  });
				  return;
				}
			  } catch (fetchError) {
				console.error('Erro ao tentar carregar curso:', fetchError);
			  }
			}
			
			toast({
			  title: "Erro na matrícula",
			  description: "Não foi possível realizar a matrícula. Tente novamente.",
			  variant: "destructive"
			});
		  } finally {
			setIsLoading(false);
		  }
		}, [toast, fetchCourse, fetchCourses]);

	// NOVA FUNÇÃO: Verificar status de matrícula
	const checkEnrollmentStatus = useCallback(async (courseId) => {
	  try {
		const response = await api.get(`/courses/${courseId}/enrollment`);
		return response;
	  } catch (error) {
		console.error('Erro ao verificar matrícula:', error);
		return { enrolled: false, progress: null };
	  }
	}, []);

// Handler para abrir curso - VERSÃO MELHORADA
	const handleOpenCourse = useCallback(async (course) => {
  try {
    console.log('=== ABRINDO CURSO (SEM MATRÍCULA AUTOMÁTICA) ===');
    console.log('Curso:', course.title);
    console.log('Progresso atual:', course.userProgress);
    
    setIsLoading(true);
    
    // Carregar dados completos do curso SEM fazer matrícula
    const courseData = await fetchCourse(course._id);
    
    if (courseData) {
      console.log('Dados do curso carregados:', {
        title: courseData.title,
        hasProgress: !!courseData.userProgress,
        progressValue: courseData.userProgress?.progress
      });
      
      // Sempre abrir o curso, independente de ter progresso ou não
      setSelectedCourse(courseData);
      
      if (!courseData.userProgress) {
        console.log('Usuário não matriculado - curso aberto mas conteúdo bloqueado');
      } else {
        console.log('Usuário matriculado - acesso completo ao conteúdo');
      }
    }
  } catch (error) {
    console.error('Erro ao abrir curso:', error);
    toast({
      title: "Erro",
      description: "Não foi possível acessar o curso",
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
}, [fetchCourse, toast]);


// Componente para verificar acesso às aulas - VERSÃO FINAL
const LessonAccessGuard = ({ lesson, courseProgress, children }) => {
  const hasAccess = courseProgress && courseProgress.progress !== undefined;
  
  if (!hasAccess) {
    return (
      <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
        <div className="text-gray-500">
          <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="font-semibold text-lg mb-2">Conteúdo Bloqueado</h3>
          <p className="text-sm mb-4">
            Você precisa se matricular neste curso para acessar o conteúdo das aulas.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-800 text-sm">
            💡 <strong>Dica:</strong> Use o botão "Matricular-se" no cabeçalho do curso para ter acesso completo.
          </div>
        </div>
      </div>
    );
  }
  
  return children;
};

// Função para obter progresso de uma aula específica
const getLessonProgress = useCallback((lessonId) => {
  if (!selectedCourse?.userProgress?.lessonsProgress) return null;
  
  return selectedCourse.userProgress.lessonsProgress.find(
    lp => lp.lessonId === lessonId
  );
}, [selectedCourse]);
  
  // Handlers de progresso do vídeo
  const handleVideoProgress = useCallback(async (progress) => {
    if (selectedCourse && selectedLesson) {
      try {
        await api.put(`/courses/${selectedCourse._id}/lessons/${selectedLesson._id}/progress`, {
          timeSpent: 30,
          lastPosition: progress
        });
      } catch (error) {
        console.error('Erro ao atualizar progresso:', error);
      }
    }
  }, [selectedCourse, selectedLesson]);

  const handleVideoComplete = useCallback(async () => {
    if (selectedCourse && selectedLesson) {
      try {
        await api.put(`/courses/${selectedCourse._id}/lessons/${selectedLesson._id}/progress`, {
          completed: true
        });
        
        toast({
          title: "Parabéns!",
          description: "Aula concluída com sucesso!"
        });
        
        await fetchCourse(selectedCourse._id);
      } catch (error) {
        console.error('Erro ao marcar aula como concluída:', error);
      }
    }
  }, [selectedCourse, selectedLesson, toast]);
  
  // Resetar formulários
  const resetCourseForm = () => {
    setCourseForm({
      _id: '',
      title: '',
      description: '',
      category: '',
      level: 'Iniciante',
      estimatedDuration: '',
      departamentoVisibilidade: ['TODOS'],
      allowDownload: true,
      certificateEnabled: false,
      passingScore: 70,
      isPublished: false,
      thumbnail: null,
      currentThumbnail: ''
    });
  };

  const resetLessonForm = () => {
    setLessonForm({
      _id: '',
      title: '',
      description: '',
      type: 'video',
      content: '',
      videoUrl: '',
      videoFile: null,
      duration: '',
      order: selectedCourse?.lessons ? selectedCourse.lessons.length + 1 : 1,
      isPublished: true,
      materials: []
    });
  };

  // CRUD de curso
  const handleCreateCourse = async () => {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('title', courseForm.title);
      formData.append('description', courseForm.description);
      formData.append('category', courseForm.category);
      formData.append('level', courseForm.level);
      formData.append('estimatedDuration', courseForm.estimatedDuration);
      formData.append('departamentoVisibilidade', JSON.stringify(courseForm.departamentoVisibilidade));
      formData.append('allowDownload', courseForm.allowDownload.toString());
      formData.append('certificateEnabled', courseForm.certificateEnabled.toString());
      formData.append('passingScore', courseForm.passingScore.toString());
      formData.append('isPublished', courseForm.isPublished.toString());
      
      if (courseForm.thumbnail) {
        formData.append('thumbnail', courseForm.thumbnail);
      }
      
      const response = await api.upload('/courses', formData);
      console.log('Curso criado:', response);
      
      toast({
        title: "Sucesso",
        description: "Curso criado com sucesso!"
      });
      
      fetchCourses();
      resetCourseForm();
      setShowCreateCourse(false);
      
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar curso. Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCourse = async () => {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('title', courseForm.title);
      formData.append('description', courseForm.description);
      formData.append('category', courseForm.category);
      formData.append('level', courseForm.level);
      formData.append('estimatedDuration', courseForm.estimatedDuration);
      formData.append('departamentoVisibilidade', JSON.stringify(courseForm.departamentoVisibilidade));
      formData.append('allowDownload', courseForm.allowDownload.toString());
      formData.append('certificateEnabled', courseForm.certificateEnabled.toString());
      formData.append('passingScore', courseForm.passingScore.toString());
      formData.append('isPublished', courseForm.isPublished.toString());
      
      if (courseForm.thumbnail) {
        formData.append('thumbnail', courseForm.thumbnail);
      }
      
      const response = await api.uploadPut(`/courses/${courseForm._id}`, formData);
      
      toast({
        title: "Sucesso",
        description: "Curso atualizado com sucesso!"
      });
      
      if (selectedCourse && selectedCourse._id === courseForm._id) {
        await fetchCourse(courseForm._id);
      }
      
      fetchCourses();
      resetCourseForm();
      setShowCreateCourse(false);
      setIsEditingCourse(false);
      
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar curso.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      setIsLoading(true);
      
      await api.delete(`/courses/${courseForm._id}`);
      
      toast({
        title: "Sucesso",
        description: "Curso excluído com sucesso!"
      });
      
      if (selectedCourse && selectedCourse._id === courseForm._id) {
        setSelectedCourse(null);
      }
      
      fetchCourses();
      resetCourseForm();
      setShowCreateCourse(false);
      setIsEditingCourse(false);
      
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir curso.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD de aula
  const handleCreateLesson = async () => {
    if (!selectedCourse) return;
    
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('title', lessonForm.title);
      formData.append('description', lessonForm.description);
      formData.append('type', lessonForm.type);
      formData.append('content', lessonForm.content);
      formData.append('videoUrl', lessonForm.videoUrl);
      formData.append('duration', lessonForm.duration);
      formData.append('order', lessonForm.order.toString());
      formData.append('isPublished', lessonForm.isPublished.toString());
      
      if (lessonForm.videoFile) {
        formData.append('videoFile', lessonForm.videoFile);
      }
      
      const response = await api.upload(`/courses/${selectedCourse._id}/lessons`, formData);
      
      toast({
        title: "Sucesso",
        description: "Aula criada com sucesso!"
      });
      
      await fetchCourse(selectedCourse._id);
      resetLessonForm();
      setShowCreateLesson(false);
      
    } catch (error) {
      console.error('Erro ao criar aula:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar aula.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLesson = async () => {
    if (!selectedCourse || !lessonForm._id) return;
    
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('title', lessonForm.title);
      formData.append('description', lessonForm.description);
      formData.append('type', lessonForm.type);
      formData.append('content', lessonForm.content);
      formData.append('videoUrl', lessonForm.videoUrl);
      formData.append('duration', lessonForm.duration);
      formData.append('order', lessonForm.order.toString());
      formData.append('isPublished', lessonForm.isPublished.toString());
      
      if (lessonForm.videoFile) {
        formData.append('videoFile', lessonForm.videoFile);
      }
      
      const response = await api.uploadPut(`/courses/${selectedCourse._id}/lessons/${lessonForm._id}`, formData);
      
      toast({
        title: "Sucesso",
        description: "Aula atualizada com sucesso!"
      });
      
      const updatedCourse = await fetchCourse(selectedCourse._id);
      
      if (selectedLesson && selectedLesson._id === lessonForm._id) {
        const updatedLesson = updatedCourse.lessons.find(l => l._id === lessonForm._id);
        if (updatedLesson) {
          setSelectedLesson(updatedLesson);
        }
      }
      
      resetLessonForm();
      setShowCreateLesson(false);
      setIsEditingLesson(false);
      
    } catch (error) {
      console.error('Erro ao atualizar aula:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar aula.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Adicionar esta função no componente EADPage, antes do return
	const handleDownloadMaterial = useCallback(async (material) => {
	  if (!selectedCourse || !selectedLesson) {
		toast({
		  title: "Erro",
		  description: "Curso ou aula não selecionados",
		  variant: "destructive"
		});
		return;
	  }

	  try {
		// Se é um link externo, abrir em nova aba
		if (material.url) {
		  window.open(material.url, '_blank');
		  return;
		}

		// Se é um arquivo local, fazer download via API
		if (material.filePath || material._id) {
		  const materialId = material._id || material.id;
		  
		  console.log('Iniciando download do material:', {
			materialId,
			materialName: material.name,
			courseId: selectedCourse._id,
			lessonId: selectedLesson._id
		  });

		  // Fazer requisição para download
		  const token = localStorage.getItem('token');
		  if (!token) {
			toast({
			  title: "Erro",
			  description: "Usuário não autenticado",
			  variant: "destructive"
			});
			return;
		  }

		  const downloadUrl = `${api.getBaseUrl()}/courses/${selectedCourse._id}/materials/${materialId}/download`;
		  
		  // Criar um link temporário para download
		  const link = document.createElement('a');
		  link.href = downloadUrl;
		  link.target = '_blank';
		  
		  // Adicionar headers de autenticação
		  const response = await fetch(downloadUrl, {
			method: 'GET',
			headers: {
			  'Authorization': `Bearer ${token}`,
			  'x-auth-token': token
			}
		  });

		  if (!response.ok) {
			throw new Error(`Erro no download: ${response.status}`);
		  }

		  // Obter o blob da resposta
		  const blob = await response.blob();
		  
		  // Criar URL do blob
		  const blobUrl = window.URL.createObjectURL(blob);
		  
		  // Obter nome do arquivo do header ou usar nome padrão
		  let filename = material.name || 'material';
		  const contentDisposition = response.headers.get('Content-Disposition');
		  if (contentDisposition) {
			const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
			if (fileNameMatch && fileNameMatch[1]) {
			  filename = fileNameMatch[1];
			}
		  }
		  
		  // Criar link de download
		  link.href = blobUrl;
		  link.download = filename;
		  
		  // Adicionar ao DOM, clicar e remover
		  document.body.appendChild(link);
		  link.click();
		  
		  // Cleanup
		  setTimeout(() => {
			document.body.removeChild(link);
			window.URL.revokeObjectURL(blobUrl);
		  }, 100);

		  toast({
			title: "Sucesso",
			description: `Download de "${material.name}" iniciado`
		  });
		}
	  } catch (error) {
		console.error('Erro no download do material:', error);
		toast({
		  title: "Erro",
		  description: "Não foi possível fazer o download do material",
		  variant: "destructive"
		});
	  }
	}, [selectedCourse, selectedLesson, toast]);

  const handleDeleteLesson = async () => {
    if (!selectedCourse || !lessonForm._id) return;
    
    try {
      setIsLoading(true);
      
      await api.delete(`/courses/${selectedCourse._id}/lessons/${lessonForm._id}`);
      
      toast({
        title: "Sucesso",
        description: "Aula excluída com sucesso!"
      });
      
      if (selectedLesson && selectedLesson._id === lessonForm._id) {
        setSelectedLesson(null);
      }
      
      await fetchCourse(selectedCourse._id);
      resetLessonForm();
      setShowCreateLesson(false);
      setIsEditingLesson(false);
      
    } catch (error) {
      console.error('Erro ao excluir aula:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir aula.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // CORRIGIDO: Adicionar material via API
  const handleAddMaterial = useCallback(async () => {
    if (!selectedCourse || !selectedLesson) {
      toast({
        title: "Erro",
        description: "Curso ou aula não selecionados",
        variant: "destructive"
      });
      return;
    }

    if (!materialForm.name || (!materialForm.file && !materialForm.url)) {
      toast({
        title: "Erro",
        description: "Nome e arquivo/URL são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('name', materialForm.name);
      formData.append('type', materialForm.type);
      
      if (materialForm.file) {
        formData.append('material', materialForm.file); // CORRIGIDO: usar 'material' como fieldname
      } else if (materialForm.url) {
        formData.append('url', materialForm.url);
      }
      
      console.log('Enviando material:', {
        name: materialForm.name,
        type: materialForm.type,
        hasFile: !!materialForm.file,
        url: materialForm.url
      });
      
      const response = await api.upload(
        `/courses/${selectedCourse._id}/lessons/${selectedLesson._id}/materials`, 
        formData
      );
      
      console.log('Resposta da API:', response);
      
      toast({
        title: "Sucesso",
        description: "Material adicionado com sucesso!"
      });
      
      // Recarregar o curso para buscar os materiais atualizados
      const updatedCourse = await fetchCourse(selectedCourse._id);
      
      // Atualizar a aula selecionada com os novos materiais
      if (updatedCourse && selectedLesson) {
        const updatedLesson = updatedCourse.lessons.find(l => l._id === selectedLesson._id);
        if (updatedLesson) {
          setSelectedLesson(updatedLesson);
        }
      }
      
      // Resetar formulário
      setMaterialForm({
        name: '',
        type: 'pdf',
        file: null,
        url: ''
      });
      setShowAddMaterial(false);
      
    } catch (error) {
      console.error('Erro ao adicionar material:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar material. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourse, selectedLesson, materialForm, toast]);

  const handleRemoveMaterial = useCallback(async (materialId) => {
    if (!selectedCourse || !selectedLesson) return;
    
    try {
      await api.delete(`/courses/${selectedCourse._id}/lessons/${selectedLesson._id}/materials/${materialId}`);
      
      // Recarregar curso
      const updatedCourse = await fetchCourse(selectedCourse._id);
      if (updatedCourse) {
        const updatedLesson = updatedCourse.lessons.find(l => l._id === selectedLesson._id);
        if (updatedLesson) {
          setSelectedLesson(updatedLesson);
        }
      }
      
      toast({
        title: "Sucesso",
        description: "Material removido com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao remover material:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover material.",
        variant: "destructive"
      });
    }
  }, [selectedCourse, selectedLesson, toast]);

  // Handlers para edição
  const handleEditCourse = (course) => {
    setCourseForm({
      _id: course._id,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      estimatedDuration: course.estimatedDuration,
      departamentoVisibilidade: course.departamentoVisibilidade || ['TODOS'],
      allowDownload: course.allowDownload !== false,
      certificateEnabled: course.certificateEnabled || false,
      passingScore: course.passingScore || 70,
      isPublished: course.isPublished || false,
      thumbnail: null,
      currentThumbnail: course.thumbnail
    });
    setIsEditingCourse(true);
    setShowCreateCourse(true);
  };

  const handleEditLesson = (lesson) => {
    setLessonForm({
      _id: lesson._id,
      title: lesson.title,
      description: lesson.description || '',
      type: lesson.type,
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      videoFile: null,
      duration: lesson.duration || '',
      order: lesson.order || 1,
      isPublished: lesson.isPublished !== false,
      materials: lesson.materials || []
    });
    setIsEditingLesson(true);
    setShowCreateLesson(true);
  };

  // Filtrar cursos
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'video': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'document': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'image': return <Image className="h-4 w-4 text-green-500" />;
      case 'link': return <Link2 className="h-4 w-4 text-purple-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // Vista Detalhada do Curso com VideoPlayer
 // Vista Detalhada do Curso - COM CONTROLE DE ACESSO
const CourseDetailView = () => {
  // Se não tem progresso (não matriculado), mostrar tela de apresentação
  if (!selectedCourse.userProgress) {
    return (
      <div className="space-y-6">
        {/* Header de navegação */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedCourse(null)}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Cursos
          </Button>
          
          {canManageCourses && (
            <Button
              variant="outline"
              onClick={() => handleEditCourse(selectedCourse)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações do Curso
            </Button>
          )}
        </div>

        {/* Tela de Apresentação do Curso */}
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            {/* Banner do curso */}
            <div className="relative h-64 bg-gradient-to-r from-red-500 to-red-600">
              {selectedCourse.thumbnail ? (
                <img 
                  src={selectedCourse.thumbnail} 
                  alt={selectedCourse.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-white/80" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex gap-2 mb-3">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {selectedCourse.level}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {selectedCourse.category}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold mb-2">{selectedCourse.title}</h1>
                <p className="text-lg opacity-90">{selectedCourse.description}</p>
              </div>
            </div>

            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Informações do curso */}
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Sobre este curso</h2>
                    <p className="text-gray-600 leading-relaxed">
                      {selectedCourse.description}
                    </p>
                  </div>

                  {selectedCourse.objectives && selectedCourse.objectives.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">O que você vai aprender</h3>
                      <ul className="space-y-2">
                        {selectedCourse.objectives.map((objective, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedCourse.requirements && selectedCourse.requirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Pré-requisitos</h3>
                      <ul className="space-y-2">
                        {selectedCourse.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-600">{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Conteúdo do curso (preview) */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Conteúdo do curso</h3>
                    <div className="space-y-2">
                      {selectedCourse.lessons?.map((lesson, index) => (
                        <div key={lesson._id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-700">{lesson.title}</p>
                            <p className="text-sm text-gray-500">
                              {lesson.type === 'video' && <Eye className="inline h-3 w-3 mr-1" />}
                              {lesson.type === 'text' && <FileText className="inline h-3 w-3 mr-1" />}
                              {lesson.duration || 'Sem duração'}
                              {lesson.materials && lesson.materials.length > 0 && (
                                <span> • {lesson.materials.length} materiais</span>
                              )}
                            </p>
                          </div>
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar com call-to-action */}
                <div className="space-y-6">
                  <Card className="border-2 border-red-200 bg-red-50">
                    <CardContent className="p-6 text-center">
                      <div className="mb-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <BookOpen className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Comece agora!</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Matricule-se gratuitamente e tenha acesso completo ao conteúdo
                        </p>
                      </div>
                      
                      <Button 
                        className="w-full bg-red-600 hover:bg-red-700 text-white mb-3"
                        size="lg"
                        onClick={() => handleEnrollCourse(selectedCourse)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        ) : (
                          <>
                            <Plus className="h-5 w-5 mr-2" />
                            Matricular-se Gratuitamente
                          </>
                        )}
                      </Button>
                      
                      <p className="text-xs text-gray-500">
                        Acesso imediato • Sem custos • Certificado incluído
                      </p>
                    </CardContent>
                  </Card>

                  {/* Detalhes do curso */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Detalhes do curso</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duração:</span>
                          <span className="font-medium">{selectedCourse.estimatedDuration || 'Flexível'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Aulas:</span>
                          <span className="font-medium">{selectedCourse.lessons?.length || 0} aulas</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nível:</span>
                          <span className="font-medium">{selectedCourse.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Alunos:</span>
                          <span className="font-medium">{selectedCourse.enrollmentCount || 0} matriculados</span>
                        </div>
                        {selectedCourse.certificateEnabled && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Certificado:</span>
                            <span className="font-medium text-green-600">✓ Disponível</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Se tem progresso (matriculado), mostrar a interface normal do curso
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedCourse(null)}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Cursos
        </Button>
        
        {canManageCourses && (
          <Button
            variant="outline"
            onClick={() => handleEditCourse(selectedCourse)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações do Curso
          </Button>
        )}
        
        {/* Indicador de matrícula */}
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-4 w-4 mr-1" />
          Matriculado
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player de Conteúdo - ACESSO LIBERADO */}
        <div className="lg:col-span-2">
          <VideoPlayer 
            lesson={selectedLesson}
            onProgress={handleVideoProgress}
            onComplete={handleVideoComplete}
          />
          
          {/* Resto do conteúdo da aula permanece igual... */}
          {selectedLesson && (
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className={`h-5 w-5 ${
                      getLessonProgress(selectedLesson._id)?.completed 
                        ? 'text-green-500' 
                        : 'text-gray-300'
                    }`} />
                    {selectedLesson.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={
                      getLessonProgress(selectedLesson._id)?.completed 
                        ? "default" 
                        : "secondary"
                    }>
                      {getLessonProgress(selectedLesson._id)?.completed 
                        ? 'Concluída' 
                        : 'Pendente'
                      }
                    </Badge>
                    {!selectedLesson.isPublished && (
                      <Badge variant="outline" className="text-orange-600">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Não Publicada
                      </Badge>
                    )}
                    {canManageLessons && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditLesson(selectedLesson)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Conteúdo da aula - já tem acesso */}
                <div className="space-y-4">
                  {selectedLesson.description && (
                    <p className="text-gray-600">{selectedLesson.description}</p>
                  )}
                  
                  {selectedLesson.type === 'text' && selectedLesson.content && (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-medium mb-2">Conteúdo da Aula</h4>
                      <div className="whitespace-pre-wrap text-sm">
                        {selectedLesson.content}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-3">Materiais da Aula</h4>
                    <div className="space-y-3">
                      {selectedLesson.materials?.map((material) => (
                        <div key={material.id || material._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            {getFileIcon(material.type)}
                            <div>
                              <p className="font-medium">{material.name}</p>
                              {material.size && (
                                <p className="text-sm text-gray-500">{material.size}</p>
                              )}
                              {material.description && (
                                <p className="text-xs text-gray-400">{material.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadMaterial(material)}
                              title={material.url ? "Abrir link" : "Fazer download"}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {canManageMaterials && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveMaterial(material.id || material._id)}
                                className="text-red-500 hover:text-red-700"
                                title="Remover material"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {canManageMaterials && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setShowAddMaterial(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Material
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar com Lista de Aulas - ACESSO LIBERADO */}
        <div className="space-y-4">
          {/* Informações do Curso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {selectedCourse.title}
                {!selectedCourse.isPublished && (
                  <Badge variant="outline" className="text-orange-600">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Não Publicado
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">{selectedCourse.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedCourse.estimatedDuration || 'Duração não informada'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {selectedCourse.enrollmentCount || 0} alunos
                  </div>
                </div>
                
                {/* Mostrar progresso */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Seu progresso</span>
                    <span>{selectedCourse.userProgress.progress}%</span>
                  </div>
                  <Progress value={selectedCourse.userProgress.progress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Aulas - ACESSÍVEIS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conteúdo do Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedCourse.lessons?.map((lesson, index) => {
                  const lessonProgress = getLessonProgress(lesson._id);
                  
                  return (
                    <div
                      key={lesson._id}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedLesson?._id === lesson._id 
                          ? 'bg-red-50 border-red-200 border-2' 
                          : 'hover:bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => setSelectedLesson(lesson)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          lessonProgress?.completed 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {lessonProgress?.completed ? <CheckCircle className="h-4 w-4" /> : lesson.order || index + 1}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{lesson.title}</p>
                            {!lesson.isPublished && (
                              <EyeOff className="h-3 w-3 text-orange-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {lesson.type === 'video' && <Eye className="h-3 w-3" />}
                            {lesson.type === 'text' && <FileText className="h-3 w-3" />}
                            <span>{lesson.duration || 'Sem duração'}</span>
                            {lesson.materials && lesson.materials.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{lesson.materials.length} materiais</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {canManageLessons && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => {
                      resetLessonForm();
                      setShowCreateLesson(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Aula
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

  // Vista Principal com Lista de Cursos
  const CoursesGridView = () => (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centro de Aprendizagem EAD</h1>
          <p className="text-gray-600 mt-2">Desenvolva suas habilidades com nossos cursos especializados</p>
        </div>
        
        {canManageCourses && (
          <div className="flex gap-2">
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                resetCourseForm();
                setIsEditingCourse(false);
                setShowCreateCourse(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Curso
            </Button>
          </div>
        )}
      </div>

      {/* Busca e Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Buscar cursos..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cursos - COM INDICADORES MELHORADOS */}
    <div className={viewMode === 'grid' 
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      : "space-y-4"
    }>
      {filteredCourses.map((course) => (
        <Card 
          key={course._id} 
          className="hover:shadow-lg transition-shadow group relative"
        >
          {/* Indicadores de status */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            <Badge 
              variant={course.level === 'Obrigatório' ? 'destructive' : 'default'}
              className="bg-white/90 text-gray-800 text-xs"
            >
              {course.level}
            </Badge>
            {!course.isPublished && (
              <Badge variant="outline" className="bg-white/90 text-orange-600 text-xs">
                <EyeOff className="h-3 w-3 mr-1" />
                Rascunho
              </Badge>
            )}
            {course.userProgress && (
              <Badge className="bg-green-500/90 text-white text-xs">
                Matriculado
              </Badge>
            )}
          </div>

          {/* Botão de edição para admins */}
          {canManageCourses && (
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCourse(course);
                }}
                className="bg-white/90 backdrop-blur-sm"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div 
            className="cursor-pointer"
            onClick={() => handleOpenCourse(course)}
          >
            {viewMode === 'grid' ? (
              <>
                <div className="relative overflow-hidden rounded-t-lg">
                  <img 
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'} 
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {course.userProgress && course.userProgress.progress > 0 && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-white/90 rounded-full p-1">
                        <Progress value={course.userProgress.progress} className="h-1" />
                      </div>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-red-600 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.estimatedDuration || 'Sem duração'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.enrollmentCount || 0} alunos
                      </div>
                    </div>
                    
                    {course.userProgress && course.userProgress.progress > 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Progresso</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(course.userProgress.progress)}% concluído
                        </Badge>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <Button 
                          size="sm" 
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnrollCourse(course);
                          }}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Matricular-se
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </>
            ) : (
              // Vista em lista permanece similar com os mesmos indicadores
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <img 
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'} 
                    alt={course.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold group-hover:text-red-600 transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant={course.level === 'Obrigatório' ? 'destructive' : 'default'}>
                          {course.level}
                        </Badge>
                        {!course.isPublished && (
                          <Badge variant="outline" className="text-orange-600">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Rascunho
                          </Badge>
                        )}
                        {course.userProgress && (
                          <Badge className="bg-green-500 text-white">
                            Matriculado
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm">{course.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.estimatedDuration || 'Sem duração'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.enrollmentCount || 0} alunos
                      </span>
                    </div>
                    
                    {course.userProgress && course.userProgress.progress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{Math.round(course.userProgress.progress)}%</span>
                        </div>
                        <Progress value={course.userProgress.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </div>
        </Card>
      ))}
    </div>

      {filteredCourses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum curso encontrado</h3>
          <p className="text-gray-500">
            {searchTerm 
              ? `Não encontramos cursos para "${searchTerm}"`
              : "Não há cursos disponíveis no momento"}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : (
          selectedCourse ? <CourseDetailView /> : <CoursesGridView />
        )}
        
        {/* Diálogos - Só renderiza se tem permissão */}
        {canManageCourses && (
          <CreateCourseDialog
            open={showCreateCourse}
            onOpenChange={(open) => {
              setShowCreateCourse(open);
              if (!open) {
                setIsEditingCourse(false);
                resetCourseForm();
              }
            }}
            courseForm={courseForm}
            setCourseForm={setCourseForm}
            onCreateCourse={handleCreateCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            isEditing={isEditingCourse}
          />
        )}
        
        {canManageLessons && (
          <CreateLessonDialog
            open={showCreateLesson}
            onOpenChange={(open) => {
              setShowCreateLesson(open);
              if (!open) {
                setIsEditingLesson(false);
                resetLessonForm();
              }
            }}
            selectedCourse={selectedCourse}
            lessonForm={lessonForm}
            setLessonForm={setLessonForm}
            onCreateLesson={handleCreateLesson}
            onUpdateLesson={handleUpdateLesson}
            onDeleteLesson={handleDeleteLesson}
            isEditing={isEditingLesson}
          />
        )}
        
        {canManageMaterials && (
          <AddMaterialDialog
            open={showAddMaterial}
            onOpenChange={setShowAddMaterial}
            selectedLesson={selectedLesson}
            materialForm={materialForm}
            setMaterialForm={setMaterialForm}
            onAddMaterial={handleAddMaterial}
          />
        )}
      </div>
    </Layout>
  );
};

export default EADPage;