// frontend/src/components/ead/EnrolledStudentsDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Clock, 
  Trophy, 
  BookOpen, 
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface EnrolledStudent {
  _id: string;
  nome: string;
  email: string;
  departamento: string;
  avatar?: string;
  enrolledAt: string;
  progress: number;
  status: string;
  lastAccessedAt?: string;
  totalTimeSpent: number;
  completedLessons: number;
  totalLessons: number;
}

interface EnrolledStudentsData {
  course: {
    _id: string;
    title: string;
    totalLessons: number;
  };
  students: EnrolledStudent[];
  totalEnrolled: number;
  pagination: {
    current: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface EnrolledStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  enrollmentCount: number;
}

const EnrolledStudentsDialog: React.FC<EnrolledStudentsDialogProps> = ({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  enrollmentCount
}) => {
  const [data, setData] = useState<EnrolledStudentsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredStudents, setFilteredStudents] = useState<EnrolledStudent[]>([]);

  // Buscar dados dos alunos matriculados
  const fetchEnrolledStudents = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${courseId}/enrolled-students?page=${page}&limit=20`);
      setData(response);
      setFilteredStudents(response.students);
    } catch (error) {
      console.error('Erro ao buscar alunos matriculados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de alunos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados quando o dialog for aberto
  useEffect(() => {
    if (open && courseId) {
      fetchEnrolledStudents(1);
      setCurrentPage(1);
      setSearchTerm('');
    }
  }, [open, courseId]);

  // Filtrar estudantes com base na busca
  useEffect(() => {
    if (!data) return;

    const filtered = data.students.filter(student =>
      student.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.departamento.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, data]);

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'in_progress': return 'Em Progresso';
      case 'not_started': return 'Não Iniciado';
      default: return 'Desconhecido';
    }
  };

  const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchEnrolledStudents(newPage);
  };

  const exportStudentsList = async () => {
    try {
      // Aqui você pode implementar a exportação para CSV/Excel
      toast({
        title: "Exportação",
        description: "Funcionalidade de exportação será implementada em breve",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar lista",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Alunos Matriculados
          </DialogTitle>
          <DialogDescription>
            {courseTitle} • {enrollmentCount} alunos matriculados
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Filtros e Busca */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={exportStudentsList}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>

            {/* Lista de Estudantes */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'Nenhum aluno encontrado com esses critérios' : 'Nenhum aluno matriculado ainda'}
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <Card key={student._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Avatar e Info Básica */}
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>
                            {student.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          {/* Nome e Email */}
                          <div>
                            <h4 className="font-semibold text-sm">{student.nome}</h4>
                            <p className="text-xs text-gray-600">{student.email}</p>
                            <p className="text-xs text-gray-500">{student.departamento}</p>
                          </div>

                          {/* Progresso */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Progresso do curso</span>
                              <span className="font-medium">{student.progress}%</span>
                            </div>
                            <Progress value={student.progress} className="h-2 progress-custom" />
                          </div>

                          {/* Estatísticas */}
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              <span>{student.completedLessons}/{student.totalLessons} aulas</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimeSpent(student.totalTimeSpent)}</span>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getStatusColor(student.status)}`}
                            >
                              {getStatusText(student.status)}
                            </Badge>
                          </div>

                          {/* Datas */}
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Matriculado em: {formatDate(student.enrolledAt)}</span>
                            {student.lastAccessedAt && (
                              <span>Último acesso: {formatDate(student.lastAccessedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Paginação */}
            {data && data.pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {((currentPage - 1) * data.pagination.limit) + 1} - {Math.min(currentPage * data.pagination.limit, data.totalEnrolled)} de {data.totalEnrolled} alunos
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {data.pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === data.pagination.pages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnrolledStudentsDialog;