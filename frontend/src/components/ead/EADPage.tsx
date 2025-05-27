import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Grid,
  List,
  Pause,
  SkipForward,
  Volume2,
  Maximize,
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Upload,
  X,
  Save,
  PlayCircle,
  Award,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Simulando o componente DepartamentoSelector
const DepartamentoSelector = ({ onChange, initialSelected = ['TODOS'], showLabel = true, compact = false }) => {
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

  return (
    <div className="space-y-2">
      {showLabel && <Label>Departamentos</Label>}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedDepartments.includes('TODOS')}
            onChange={() => onChange(['TODOS'])}
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

// Dados de exemplo
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
        materials: [
          { type: "pdf", name: "Manual de Vendas.pdf", size: "2.5 MB" },
          { type: "link", name: "Artigo Complementar", url: "#" }
        ]
      },
      {
        id: 2,
        title: "Técnicas de Abordagem",
        type: "video",
        duration: "22 min",
        completed: true,
        materials: [
          { type: "video", name: "Demonstração Prática.mp4", size: "15 MB" },
          { type: "document", name: "Checklist de Abordagem.docx", size: "1.2 MB" }
        ]
      },
      {
        id: 3,
        title: "Fechamento de Vendas",
        type: "video",
        duration: "18 min",
        completed: false,
        materials: [
          { type: "pdf", name: "Estratégias de Fechamento.pdf", size: "3.1 MB" },
          { type: "image", name: "Infográfico Vendas.png", size: "800 KB" }
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
        materials: [
          { type: "pdf", name: "Manual de Atendimento.pdf", size: "4.2 MB" }
        ]
      },
      {
        id: 2,
        title: "Comunicação Eficaz",
        type: "video",
        duration: "25 min",
        completed: false,
        materials: [
          { type: "video", name: "Exemplos de Comunicação.mp4", size: "20 MB" }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "Segurança do Trabalho",
    description: "Normas e práticas de segurança no ambiente de trabalho",
    instructor: "Ana Costa",
    duration: "12 horas",
    students: 89,
    rating: 4.7,
    progress: 0,
    thumbnail: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=400",
    category: "Segurança",
    level: "Obrigatório",
    departamentoVisibilidade: ['TODOS'],
    lessons: [
      {
        id: 1,
        title: "Introdução à Segurança",
        type: "video",
        duration: "30 min",
        completed: false,
        materials: [
          { type: "pdf", name: "Manual de Segurança.pdf", size: "5.8 MB" },
          { type: "link", name: "Normas Regulamentadoras", url: "#" }
        ]
      }
    ]
  }
];

const EADPage = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState(['TODOS']);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300);
  
  // Estados para criação de curso
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Iniciante',
    estimatedDuration: '',
    objectives: [],
    requirements: [],
    departamentoVisibilidade: ['TODOS'],
    allowDownload: true,
    certificateEnabled: false,
    passingScore: 70,
    tags: []
  });
  
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    type: 'video',
    content: '',
    videoUrl: '',
    duration: '',
    materials: []
  });

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesDepartment = departmentFilter.includes('TODOS') || 
                             departmentFilter.some(dept => course.departamentoVisibilidade?.includes(dept));
    return matchesSearch && matchesCategory && matchesDepartment;
  });

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

  // Handlers
  const handleCreateCourse = () => {
    console.log('Criando curso:', courseForm);
    setShowCreateCourse(false);
    setCourseForm({
      title: '',
      description: '',
      category: '',
      level: 'Iniciante',
      estimatedDuration: '',
      objectives: [],
      requirements: [],
      departamentoVisibilidade: ['TODOS'],
      allowDownload: true,
      certificateEnabled: false,
      passingScore: 70,
      tags: []
    });
  };

  const handleCreateLesson = () => {
    console.log('Criando aula:', lessonForm);
    setShowCreateLesson(false);
    setLessonForm({
      title: '',
      description: '',
      type: 'video',
      content: '',
      videoUrl: '',
      duration: '',
      materials: []
    });
  };

  const handleDepartmentChange = (departments) => {
    setDepartmentFilter(departments);
  };

  const handleCourseDepartmentChange = (departments) => {
    setCourseForm(prev => ({
      ...prev,
      departamentoVisibilidade: departments
    }));
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
                <Tabs defaultValue="materials">
                  <TabsList>
                    <TabsTrigger value="materials">Materiais</TabsTrigger>
                    <TabsTrigger value="notes">Anotações</TabsTrigger>
                    <TabsTrigger value="discussion">Discussão</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="materials" className="mt-4">
                    <div className="space-y-3">
                      {selectedLesson.materials?.map((material, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            {getFileIcon(material.type)}
                            <div>
                              <p className="font-medium">{material.name}</p>
                              {material.size && (
                                <p className="text-sm text-gray-500">{material.size}</p>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Material
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="notes" className="mt-4">
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-2">Suas anotações para esta aula:</p>
                        <textarea 
                          className="w-full h-32 p-3 border rounded-md resize-none"
                          placeholder="Adicione suas anotações aqui..."
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="discussion" className="mt-4">
                    <div className="space-y-4">
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Sem discussões ainda</p>
                        <p className="text-sm">Seja o primeiro a iniciar uma discussão!</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedCourse.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {selectedCourse.students} alunos
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {selectedCourse.rating}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progresso do Curso</span>
                    <span>{selectedCourse.progress}%</span>
                  </div>
                  <Progress value={selectedCourse.progress} className="h-2" />
                </div>
                
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{selectedCourse.instructor[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{selectedCourse.instructor}</p>
                    <p className="text-xs text-gray-500">Instrutor</p>
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

      {/* Filtros e Busca */}
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select 
                className="px-3 py-2 border rounded-md"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Todas as Categorias</option>
                <option value="vendas">Vendas</option>
                <option value="atendimento">Atendimento</option>
                <option value="segurança">Segurança</option>
              </select>
              
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
          
          {/* Filtro de Departamento */}
          <div className="mt-4 pt-4 border-t">
            <DepartamentoSelector 
              onChange={handleDepartmentChange}
              initialSelected={departmentFilter}
              showLabel={true}
              compact={true}
            />
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
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {course.rating}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {course.instructor.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">{course.instructor}</span>
                      </div>
                      
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
                        <Users className="h-4 w-4" />
                        {course.students}
                      </span>
					  <span className="flex items-center gap-1">
						  <Clock className="h-4 w-4" />
						  {course.duration}
						</span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {course.rating}
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

  // Diálogo de Criação de Curso
  const CreateCourseDialog = React.memo(() => (
    <Dialog open={showCreateCourse} onOpenChange={setShowCreateCourse}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Curso</DialogTitle>
          <DialogDescription>
            Preencha as informações básicas do curso. Você poderá adicionar aulas depois.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="course-title">Título do Curso *</Label>
              <Input
                id="course-title"
                value={courseForm.title}
                onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Fundamentos de Vendas"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="course-description">Descrição *</Label>
              <Textarea
                id="course-description"
                value={courseForm.description}
                onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o que os alunos aprenderão neste curso..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="course-category">Categoria *</Label>
                <Input
                  id="course-category"
                  value={courseForm.category}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Ex: Vendas, Atendimento, Segurança"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="course-level">Nível</Label>
                <Select value={courseForm.level} onValueChange={(value) => setCourseForm(prev => ({ ...prev, level: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Iniciante">Iniciante</SelectItem>
                    <SelectItem value="Intermediário">Intermediário</SelectItem>
                    <SelectItem value="Avançado">Avançado</SelectItem>
                    <SelectItem value="Obrigatório">Obrigatório</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="course-duration">Duração Estimada</Label>
              <Input
                id="course-duration"
                value={courseForm.estimatedDuration}
                onChange={(e) => setCourseForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                placeholder="Ex: 8 horas, 2 dias"
                className="mt-1"
              />
            </div>
          </div>
          
          {/* Visibilidade por Departamento */}
          <div className="space-y-3">
            <Label>Visibilidade por Departamento</Label>
            <Card className="border-gray-200">
              <CardContent className="pt-4">
                <DepartamentoSelector 
                  onChange={handleCourseDepartmentChange}
                  initialSelected={courseForm.departamentoVisibilidade}
                  showLabel={false}
                  compact={false}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Configurações Avançadas */}
          <div className="space-y-4">
            <h4 className="font-medium">Configurações do Curso</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allow-download"
                  checked={courseForm.allowDownload}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, allowDownload: e.target.checked }))}
                />
                <Label htmlFor="allow-download" className="text-sm">
                  Permitir download de materiais
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="certificate-enabled"
                  checked={courseForm.certificateEnabled}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, certificateEnabled: e.target.checked }))}
                />
                <Label htmlFor="certificate-enabled" className="text-sm">
                  Emitir certificado de conclusão
                </Label>
              </div>
            </div>
            
            {courseForm.certificateEnabled && (
              <div>
                <Label htmlFor="passing-score">Nota Mínima para Aprovação (%)</Label>
                <Input
                  id="passing-score"
                  type="number"
                  min="0"
                  max="100"
                  value={courseForm.passingScore}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateCourse(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateCourse}
            disabled={!courseForm.title || !courseForm.description || !courseForm.category}
            className="bg-red-600 hover:bg-red-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Criar Curso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ));

  // Diálogo de Criação de Aula
  const CreateLessonDialog = React.memo(() => (
    <Dialog open={showCreateLesson} onOpenChange={setShowCreateLesson}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Aula</DialogTitle>
          <DialogDescription>
            Adicione uma nova aula ao curso "{selectedCourse?.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="lesson-title">Título da Aula *</Label>
            <Input
              id="lesson-title"
              value={lessonForm.title}
              onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Introdução às Vendas"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="lesson-description">Descrição</Label>
            <Textarea
              id="lesson-description"
              value={lessonForm.description}
              onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva brevemente o conteúdo desta aula..."
              className="mt-1"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lesson-type">Tipo de Aula</Label>
              <Select value={lessonForm.type} onValueChange={(value) => setLessonForm(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="assignment">Tarefa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="lesson-duration">Duração</Label>
              <Input
                id="lesson-duration"
                value={lessonForm.duration}
                onChange={(e) => setLessonForm(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="Ex: 15 min"
                className="mt-1"
              />
            </div>
          </div>
          
          {lessonForm.type === 'video' && (
            <div>
              <Label htmlFor="video-url">URL do Vídeo</Label>
              <Input
                id="video-url"
                value={lessonForm.videoUrl}
                onChange={(e) => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                className="mt-1"
              />
            </div>
          )}
          
          {lessonForm.type === 'text' && (
            <div>
              <Label htmlFor="lesson-content">Conteúdo</Label>
              <Textarea
                id="lesson-content"
                value={lessonForm.content}
                onChange={(e) => setLessonForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Digite o conteúdo da aula..."
                className="mt-1"
                rows={4}
              />
            </div>
          )}
          
          {/* Upload de Materiais */}
          <div>
            <Label>Materiais da Aula</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOC, PPT, MP4, MP3 (máx. 100MB cada)
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateLesson(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateLesson}
            disabled={!lessonForm.title}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Aula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ));

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {selectedCourse ? <CourseDetailView /> : <CoursesGridView />}
        
        {/* Diálogos */}
        <CreateCourseDialog />
        <CreateLessonDialog />
      </div>
    </Layout>
  );
};

export default EADPage;