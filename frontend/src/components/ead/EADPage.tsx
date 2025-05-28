import React, { useState, useCallback, useEffect } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Play, 
  FileText, 
  Link2, 
  Image, 
  Download, 
  CheckCircle, 
  Clock, 
  Users, 
  Star,
  Search,
  Grid,
  List,
  Pause,
  SkipForward,
  Volume2,
  Maximize,
  ArrowLeft,
  Plus,
  Upload,
  X,
  PlayCircle,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';

// Importar os componentes de diálogo separados
import CreateCourseDialog from './CreateCourseDialog';
import CreateLessonDialog from './CreateLessonDialog';
import AddMaterialDialog from './AddMaterialDialog';

const EADPage = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para criação/edição de curso
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
  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/courses');
      console.log('Cursos carregados:', response);
      
      if (response.courses) {
        setCourses(response.courses);
      } else if (Array.isArray(response)) {
        setCourses(response);
      } else {
        setCourses([]);
      }
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
  };

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

  // Criar curso
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

  // Atualizar curso
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
      console.log('Curso atualizado:', response);
      
      toast({
        title: "Sucesso",
        description: "Curso atualizado com sucesso!"
      });
      
      // Atualizar o curso selecionado se for o mesmo
      if (selectedCourse && selectedCourse._id === courseForm._id) {
        const updatedCourse = await fetchCourse(courseForm._id);
      }
      
      fetchCourses();
      resetCourseForm();
      setShowCreateCourse(false);
      setIsEditingCourse(false);
      
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar curso. Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Excluir curso
  const handleDeleteCourse = async () => {
    try {
      setIsLoading(true);
      
      await api.delete(`/courses/${courseForm._id}`);
      
      toast({
        title: "Sucesso",
        description: "Curso excluído com sucesso!"
      });
      
      // Se o curso excluído estava sendo visualizado, voltar para a lista
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
        description: "Erro ao excluir curso. Verifique se não há alunos matriculados.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Criar aula
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
      console.log('Aula criada:', response);
      
      toast({
        title: "Sucesso",
        description: "Aula criada com sucesso!"
      });
      
      // Atualizar o curso para mostrar a nova aula
      const updatedCourse = await fetchCourse(selectedCourse._id);
      
      resetLessonForm();
      setShowCreateLesson(false);
      
    } catch (error) {
      console.error('Erro ao criar aula:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar aula. Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar aula
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
      console.log('Aula atualizada:', response);
      
      toast({
        title: "Sucesso",
        description: "Aula atualizada com sucesso!"
      });
      
      // Atualizar o curso
      const updatedCourse = await fetchCourse(selectedCourse._id);
      
      // Atualizar a aula selecionada
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
        description: "Erro ao atualizar aula. Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Excluir aula
  const handleDeleteLesson = async () => {
    if (!selectedCourse || !lessonForm._id) return;
    
    try {
      setIsLoading(true);
      
      await api.delete(`/courses/${selectedCourse._id}/lessons/${lessonForm._id}`);
      
      toast({
        title: "Sucesso",
        description: "Aula excluída com sucesso!"
      });
      
      // Se a aula excluída estava sendo visualizada, limpar seleção
      if (selectedLesson && selectedLesson._id === lessonForm._id) {
        setSelectedLesson(null);
      }
      
      // Atualizar o curso
      const updatedCourse = await fetchCourse(selectedCourse._id);
      
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

  // Adicionar material (mock - implementar upload real depois)
  const handleAddMaterial = useCallback(() => {
    if (materialForm.name && (materialForm.file || materialForm.url)) {
      const newMaterial = {
        id: Date.now(),
        name: materialForm.name,
        type: materialForm.type,
        file: materialForm.file,
        url: materialForm.url,
        size: materialForm.file ? `${(materialForm.file.size / 1024 / 1024).toFixed(1)} MB` : null
      };
      
      if (selectedLesson) {
        const updatedLesson = {
          ...selectedLesson,
          materials: [...(selectedLesson.materials || []), newMaterial]
        };
        setSelectedLesson(updatedLesson);
      }
      
      setMaterialForm({
        name: '',
        type: 'pdf',
        file: null,
        url: ''
      });
      setShowAddMaterial(false);
      
      toast({
        title: "Sucesso",
        description: "Material adicionado com sucesso!"
      });
    }
  }, [materialForm, selectedLesson, toast]);

  const handleRemoveMaterial = useCallback((materialId) => {
    if (selectedLesson) {
      const updatedLesson = {
        ...selectedLesson,
        materials: selectedLesson.materials.filter(m => m.id !== materialId)
      };
      setSelectedLesson(updatedLesson);
      
      toast({
        title: "Sucesso",
        description: "Material removido com sucesso!"
      });
    }
  }, [selectedLesson, toast]);

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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'video': return <Play className="h-4 w-4 text-blue-500" />;
      case 'document': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'image': return <Image className="h-4 w-4 text-green-500" />;
      case 'link': return <Link2 className="h-4 w-4 text-purple-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // Vista do Player de Vídeo/Conteúdo
  const ContentPlayer = () => (
    <div className="bg-black rounded-lg overflow-hidden">
      <div className="aspect-video bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <PlayCircle className="h-16 w-16 text-white mx-auto mb-4" />
          <h3 className="text-white text-xl font-medium">
            {selectedLesson?.title || 'Selecione uma aula'}
          </h3>
          <p className="text-gray-300 mt-2">
            {selectedLesson?.duration || 'Duração não disponível'}
          </p>
          {selectedLesson?.videoUrl && (
            <p className="text-gray-400 text-sm mt-2">
              {selectedLesson.videoUrl.startsWith('http') ? 'Vídeo externo' : 'Vídeo local'}
            </p>
          )}
        </div>
      </div>
      
      {/* Controles do Player */}
      <div className="bg-gray-900 p-4">
        <div className="flex items-center gap-4 mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-gray-800"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          
          <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
            <SkipForward className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 flex items-center gap-2">
            <span className="text-white text-sm">{formatTime(currentTime)}</span>
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <span className="text-white text-sm">{formatTime(duration)}</span>
          </div>
          
          <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
            <Volume2 className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Vista Detalhada do Curso
  const CourseDetailView = () => (
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
        
        <Button
          variant="outline"
          onClick={() => handleEditCourse(selectedCourse)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Configurações do Curso
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player de Conteúdo */}
        <div className="lg:col-span-2">
          <ContentPlayer />
          
          {/* Informações da Aula Atual */}
          {selectedLesson && (
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className={`h-5 w-5 ${selectedLesson.completed ? 'text-green-500' : 'text-gray-300'}`} />
                    {selectedLesson.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={selectedLesson.completed ? "default" : "secondary"}>
                      {selectedLesson.completed ? 'Concluída' : 'Pendente'}
                    </Badge>
                    {!selectedLesson.isPublished && (
                      <Badge variant="outline" className="text-orange-600">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Não Publicada
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLesson(selectedLesson)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                        <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            {getFileIcon(material.type)}
                            <div>
                              <p className="font-medium">{material.name}</p>
                              {material.size && (
                                <p className="text-sm text-gray-500">{material.size}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRemoveMaterial(material.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setShowAddMaterial(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Material
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar com Lista de Aulas */}
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
                <div className="text-sm">
                  <strong>Instrutor:</strong> {selectedCourse.instructor?.nome || 'Não informado'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Aulas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conteúdo do Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedCourse.lessons?.map((lesson, index) => (
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
                        lesson.completed 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {lesson.completed ? <CheckCircle className="h-4 w-4" /> : lesson.order || index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{lesson.title}</p>
                          {!lesson.isPublished && (
                            <EyeOff className="h-3 w-3 text-orange-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {lesson.type === 'video' && <Play className="h-3 w-3" />}
                          {lesson.type === 'text' && <FileText className="h-3 w-3" />}
                          <span>{lesson.duration || 'Sem duração'}</span>
                          {lesson.materials && (
                            <>
                              <span>•</span>
                              <span>{lesson.materials.length} materiais</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Vista Principal com Lista de Cursos
  const CoursesGridView = () => (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centro de Aprendizagem EAD</h1>
          <p className="text-gray-600 mt-2">Desenvolva suas habilidades com nossos cursos especializados</p>
        </div>
        
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

      {/* Grid de Cursos */}
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        : "space-y-4"
      }>
        {filteredCourses.map((course) => (
          <Card 
            key={course._id} 
            className="hover:shadow-lg transition-shadow group relative"
          >
            {/* Botão de edição */}
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

            <div 
              className="cursor-pointer"
              onClick={() => setSelectedCourse(course)}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img 
                      src={course.thumbnail || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'} 
                      alt={course.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Badge 
                        variant={course.level === 'Obrigatório' ? 'destructive' : 'default'}
                        className="bg-white/90 text-gray-800"
                      >
                        {course.level}
                      </Badge>
                      {!course.isPublished && (
                        <Badge variant="outline" className="bg-white/90 text-orange-600">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Rascunho
                        </Badge>
                      )}
                    </div>
                    {course.userProgress?.progress > 0 && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <Progress value={course.userProgress.progress} className="h-1" />
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
                          {course.enrollmentCount || 0}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {course.instructor?.nome || 'Instrutor não informado'}
                        </span>
                        {course.userProgress?.progress > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {course.userProgress.progress}% concluído
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
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
                        <div className="flex gap-2">
                          <Badge variant={course.level === 'Obrigatório' ? 'destructive' : 'default'}>
                            {course.level}
                          </Badge>
                          {!course.isPublished && (
                            <Badge variant="outline" className="text-orange-600">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Rascunho
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
                          {course.enrollmentCount || 0}
                        </span>
                        <span>{course.instructor?.nome || 'Instrutor não informado'}</span>
                      </div>
                      
                      {course.userProgress?.progress > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progresso</span>
                            <span>{course.userProgress.progress}%</span>
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
        
        {/* Diálogos */}
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
        
        <AddMaterialDialog
          open={showAddMaterial}
          onOpenChange={setShowAddMaterial}
          selectedLesson={selectedLesson}
          materialForm={materialForm}
          setMaterialForm={setMaterialForm}
          onAddMaterial={handleAddMaterial}
        />
      </div>
    </Layout>
  );
};

export default EADPage;