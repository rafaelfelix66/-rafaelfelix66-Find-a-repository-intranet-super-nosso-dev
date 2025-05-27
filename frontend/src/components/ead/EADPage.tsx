import React, { useState, useCallback } from 'react';
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
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Importar os componentes de diálogo separados
import CreateCourseDialog from './CreateCourseDialog';
import CreateLessonDialog from './CreateLessonDialog';

// Simulando o componente DepartamentoSelector para filtros
const DepartamentoSelector = ({ onChange, initialSelected = ['TODOS'], showLabel = true }) => {
  const [selectedDepartments, setSelectedDepartments] = useState(initialSelected);
  
  const departamentos = [
    'A CLASSIFICAR',
    'ADMINISTRATIVA', 
    'ADMINISTRATIVO', 
    'LIDERANÇA', 
    'OPERACIONAL'
  ];

  const handleToggleDepartment = (dept) => {
    let newSelected;
    if (selectedDepartments.includes(dept)) {
      newSelected = selectedDepartments.filter(d => d !== dept);
    } else {
      newSelected = [...selectedDepartments, dept];
    }
    
    if (newSelected.length === 0) {
      newSelected = ['TODOS'];
    }
    
    setSelectedDepartments(newSelected);
    onChange(newSelected);
  };

  const handleToggleAll = () => {
    const newSelected = ['TODOS'];
    setSelectedDepartments(newSelected);
    onChange(newSelected);
  };

  return (
    <div className="space-y-2">
      {showLabel && <Label>Departamentos</Label>}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedDepartments.includes('TODOS')}
            onChange={handleToggleAll}
          />
          <span className="text-sm">Todos</span>
        </label>
        {departamentos.map((dept) => (
          <label key={dept} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedDepartments.includes(dept)}
              onChange={() => handleToggleDepartment(dept)}
            />
            <span className="text-sm">{dept}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

// Dados de exemplo com departamento do usuário simulado
const userDepartment = 'OPERACIONAL'; // Simula departamento do usuário logado

const mockCourses = [
  {
    id: 1,
    title: "Fundamentos de Vendas",
    description: "Aprenda as técnicas fundamentais de vendas e relacionamento com cliente",
    instructor: "Maria Silva",
    duration: "8 horas",
    students: 156,
    rating: 4.8,
    progress: 65,
    thumbnail: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
    category: "Vendas",
    level: "Iniciante",
    departamentoVisibilidade: ['TODOS'],
    lessons: [
      {
        id: 1,
        title: "Introdução às Vendas",
        type: "video",
        duration: "15 min",
        completed: true,
        videoUrl: "https://youtube.com/watch?v=example1",
        materials: [
          { id: 1, type: "pdf", name: "Manual de Vendas.pdf", size: "2.5 MB", url: "/uploads/manual.pdf" },
          { id: 2, type: "link", name: "Artigo Complementar", url: "https://example.com/artigo" }
        ]
      },
      {
        id: 2,
        title: "Técnicas de Abordagem",
        type: "video",
        duration: "22 min",
        completed: true,
        videoUrl: "/uploads/videos/abordagem.mp4",
        materials: [
          { id: 3, type: "video", name: "Demonstração Prática.mp4", size: "15 MB", url: "/uploads/demo.mp4" },
          { id: 4, type: "document", name: "Checklist de Abordagem.docx", size: "1.2 MB", url: "/uploads/checklist.docx" }
        ]
      },
      {
        id: 3,
        title: "Fechamento de Vendas",
        type: "video",
        duration: "18 min",
        completed: false,
        videoUrl: "https://youtube.com/watch?v=example3",
        materials: [
          { id: 5, type: "pdf", name: "Estratégias de Fechamento.pdf", size: "3.1 MB", url: "/uploads/estrategias.pdf" },
          { id: 6, type: "image", name: "Infográfico Vendas.png", size: "800 KB", url: "/uploads/infografico.png" }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "Atendimento ao Cliente",
    description: "Excelência no atendimento e satisfação do cliente",
    instructor: "João Santos",
    duration: "6 horas",
    students: 203,
    rating: 4.9,
    progress: 30,
    thumbnail: "https://images.unsplash.com/photo-1553484771-371a605b060b?w=400",
    category: "Atendimento",
    level: "Intermediário",
    departamentoVisibilidade: ['ADMINISTRATIVA', 'OPERACIONAL'],
    lessons: [
      {
        id: 1,
        title: "Princípios do Atendimento",
        type: "video",
        duration: "20 min",
        completed: true,
        videoUrl: "https://youtube.com/watch?v=atendimento1",
        materials: [
          { id: 7, type: "pdf", name: "Manual de Atendimento.pdf", size: "4.2 MB", url: "/uploads/manual-atendimento.pdf" }
        ]
      },
      {
        id: 2,
        title: "Comunicação Eficaz",
        type: "video",
        duration: "25 min",
        completed: false,
        videoUrl: "/uploads/videos/comunicacao.mp4",
        materials: [
          { id: 8, type: "video", name: "Exemplos de Comunicação.mp4", size: "20 MB", url: "/uploads/exemplos.mp4" }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "Segurança Específica",
    description: "Normas específicas para departamento de liderança",
    instructor: "Ana Costa",
    duration: "4 horas",
    students: 25,
    rating: 4.7,
    progress: 0,
    thumbnail: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=400",
    category: "Segurança",
    level: "Específico",
    departamentoVisibilidade: ['LIDERANÇA'], // Este curso não aparecerá para usuário OPERACIONAL
    lessons: []
  }
];

const EADPage = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300);
  
  // Estados para criação de curso
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  
  // Estados do formulário usando useCallback para evitar re-renderizações
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Iniciante',
    estimatedDuration: '',
    departamentoVisibilidade: ['TODOS'],
    allowDownload: true,
    certificateEnabled: false,
    passingScore: 70,
    thumbnail: null
  });
  
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    type: 'video',
    videoUrl: '',
    videoFile: null,
    duration: '',
    thumbnail: null,
    materials: []
  });

  const [materialForm, setMaterialForm] = useState({
    name: '',
    type: 'pdf',
    file: null,
    url: ''
  });

  // Filtrar cursos baseado no departamento do usuário e busca
  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = course.departamentoVisibilidade.includes('TODOS') || 
                             course.departamentoVisibilidade.includes(userDepartment);
    return matchesSearch && matchesDepartment;
  });

  // Handlers usando useCallback para otimizar performance
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCreateCourse = useCallback(() => {
    console.log('Criando curso:', courseForm);
    setShowCreateCourse(false);
    setCourseForm({
      title: '',
      description: '',
      category: '',
      level: 'Iniciante',
      estimatedDuration: '',
      departamentoVisibilidade: ['TODOS'],
      allowDownload: true,
      certificateEnabled: false,
      passingScore: 70,
      thumbnail: null
    });
  }, [courseForm]);

  const handleCreateLesson = useCallback(() => {
    console.log('Criando aula:', lessonForm);
    setShowCreateLesson(false);
    setLessonForm({
      title: '',
      description: '',
      type: 'video',
      videoUrl: '',
      videoFile: null,
      duration: '',
      thumbnail: null,
      materials: []
    });
  }, [lessonForm]);

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
        // Adicionar material à aula atual
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
    }
  }, [materialForm, selectedLesson]);

  const handleRemoveMaterial = useCallback((materialId) => {
    if (selectedLesson) {
      const updatedLesson = {
        ...selectedLesson,
        materials: selectedLesson.materials.filter(m => m.id !== materialId)
      };
      setSelectedLesson(updatedLesson);
    }
  }, [selectedLesson]);

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
                  <Badge variant={selectedLesson.completed ? "default" : "secondary"}>
                    {selectedLesson.completed ? 'Concluída' : 'Pendente'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
              <CardTitle className="text-lg">{selectedCourse.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedCourse.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {selectedCourse.students} alunos
                  </div>
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
                {selectedCourse.lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedLesson?.id === lesson.id 
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
                        {lesson.completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-sm">{lesson.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Play className="h-3 w-3" />
                          <span>{lesson.duration}</span>
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
                  onClick={() => setShowCreateLesson(true)}
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
            onClick={() => setShowCreateCourse(true)}
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
            key={course.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => setSelectedCourse(course)}
          >
            {viewMode === 'grid' ? (
              <>
                <div className="relative overflow-hidden rounded-t-lg">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant={course.level === 'Obrigatório' ? 'destructive' : 'default'}
                      className="bg-white/90 text-gray-800"
                    >
                      {course.level}
                    </Badge>
                  </div>
                  {course.progress > 0 && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <Progress value={course.progress} className="h-1" />
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
                        {course.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.students}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{course.instructor}</span>
                      
                      {course.progress > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {course.progress}% concluído
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
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold group-hover:text-red-600 transition-colors">
                        {course.title}
                      </h3>
                      <Badge variant={course.level === 'Obrigatório' ? 'destructive' : 'default'}>
                        {course.level}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm">{course.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.students}
                      </span>
                      <span>{course.instructor}</span>
                    </div>
                    
                    {course.progress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
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

  // Diálogo de Adicionar Material
  const AddMaterialDialog = () => (
    <Dialog open={showAddMaterial} onOpenChange={setShowAddMaterial}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Adicionar Material</DialogTitle>
          <DialogDescription>
            Adicione um material à aula "{selectedLesson?.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="material-name">Nome do Material *</Label>
            <Input
              id="material-name"
              value={materialForm.name}
              onChange={(e) => setMaterialForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Manual de Vendas"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="material-type">Tipo de Material</Label>
            <Select 
              value={materialForm.type} 
              onValueChange={(value) => setMaterialForm(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="document">Documento</SelectItem>
                <SelectItem value="image">Imagem</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="link">Link Externo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {materialForm.type === 'link' ? (
            <div>
              <Label htmlFor="material-url">URL do Link</Label>
              <Input
                id="material-url"
                value={materialForm.url}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://exemplo.com"
                className="mt-1"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="material-file">Arquivo</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {materialForm.file ? (
                  <div className="space-y-2">
                    {getFileIcon(materialForm.type)}
                    <p className="text-sm font-medium">{materialForm.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(materialForm.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMaterialForm(prev => ({ ...prev, file: null }))}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Clique para selecionar arquivo
                    </p>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setMaterialForm(prev => ({ ...prev, file }));
                        }
                      }}
                      className="hidden"
                      id="material-file"
                    />
                    <label
                      htmlFor="material-file"
                      className="mt-2 inline-block px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer text-sm"
                    >
                      Selecionar Arquivo
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddMaterial(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAddMaterial}
            disabled={!materialForm.name || (!materialForm.file && !materialForm.url)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Material
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {selectedCourse ? <CourseDetailView /> : <CoursesGridView />}
        
        {/* Diálogos usando componentes separados */}
        <CreateCourseDialog
          open={showCreateCourse}
          onOpenChange={setShowCreateCourse}
          courseForm={courseForm}
          setCourseForm={setCourseForm}
          onCreateCourse={handleCreateCourse}
        />
        
        <CreateLessonDialog
          open={showCreateLesson}
          onOpenChange={setShowCreateLesson}
          selectedCourse={selectedCourse}
          lessonForm={lessonForm}
          setLessonForm={setLessonForm}
          onCreateLesson={handleCreateLesson}
        />
        
        <AddMaterialDialog />
      </div>
    </Layout>
  );
};

export default EADPage;