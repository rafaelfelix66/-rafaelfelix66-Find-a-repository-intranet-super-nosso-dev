import React from 'react';
import { Upload, X, Save, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Switch } from '@/components/ui/switch';

// Componente DepartamentoSelector para criação de cursos
const DepartamentoSelector = ({ onChange, initialSelected = ['TODOS'], showLabel = true }) => {
  const [selectedDepartments, setSelectedDepartments] = React.useState(initialSelected);
  
  const departamentos = [
    'A CLASSIFICAR',
    'ADMINISTRATIVA', 
    'ADMINISTRATIVO', 
    'LIDERANÇA', 
    'OPERACIONAL'
  ];

  React.useEffect(() => {
    setSelectedDepartments(initialSelected);
  }, [JSON.stringify(initialSelected)]);

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

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseForm: {
    _id?: string;
    title: string;
    description: string;
    category: string;
    level: string;
    estimatedDuration: string;
    departamentoVisibilidade: string[];
    allowDownload: boolean;
    certificateEnabled: boolean;
    passingScore: number;
    isPublished: boolean;
    thumbnail: File | null;
    currentThumbnail?: string;
  };
  setCourseForm: React.Dispatch<React.SetStateAction<any>>;
  onCreateCourse: () => void;
  onUpdateCourse?: () => void;
  onDeleteCourse?: () => void;
  isEditing?: boolean;
}

const CreateCourseDialog: React.FC<CreateCourseDialogProps> = ({
  open,
  onOpenChange,
  courseForm,
  setCourseForm,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  isEditing = false
}) => {
  const handleSave = () => {
    if (isEditing && onUpdateCourse) {
      onUpdateCourse();
    } else {
      onCreateCourse();
    }
  };

  const handleDelete = () => {
    if (onDeleteCourse && confirm('Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.')) {
      onDeleteCourse();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isEditing ? 'Editar Curso' : 'Criar Novo Curso'}</span>
            {isEditing && onDeleteCourse && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite as informações do curso.' 
              : 'Preencha as informações básicas do curso. Você poderá adicionar aulas depois.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Upload de Thumbnail */}
          <div>
            <Label htmlFor="course-thumbnail">Imagem de Capa</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {courseForm.thumbnail ? (
                <div className="space-y-2">
                  <img 
                    src={URL.createObjectURL(courseForm.thumbnail)} 
                    alt="Preview" 
                    className="mx-auto h-32 w-auto rounded"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCourseForm(prev => ({ ...prev, thumbnail: null }))}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>
              ) : courseForm.currentThumbnail ? (
                <div className="space-y-2">
                  <img 
                    src={courseForm.currentThumbnail} 
                    alt="Thumbnail atual" 
                    className="mx-auto h-32 w-auto rounded"
                  />
                  <p className="text-sm text-gray-500">Imagem atual</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCourseForm(prev => ({ ...prev, thumbnail: file }));
                      }
                    }}
                    className="hidden"
                    id="course-thumbnail"
                  />
                  <label
                    htmlFor="course-thumbnail"
                    className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
                  >
                    Alterar Imagem
                  </label>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Clique para selecionar uma imagem
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, WebP (máx. 5MB)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Validar tamanho (5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Imagem muito grande. Máximo 5MB.');
                          return;
                        }
                        setCourseForm(prev => ({ ...prev, thumbnail: file }));
                      }
                    }}
                    className="hidden"
                    id="course-thumbnail"
                  />
                  <label
                    htmlFor="course-thumbnail"
                    className="mt-2 inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
                  >
                    Selecionar Imagem
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Status de Publicação */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="is-published" className="text-base font-medium">
                Curso Publicado
              </Label>
              <p className="text-sm text-gray-500">
                Quando ativado, o curso ficará visível para os alunos
              </p>
            </div>
            <Switch
              id="is-published"
              checked={courseForm.isPublished}
              onCheckedChange={(checked) => setCourseForm(prev => ({ ...prev, isPublished: checked }))}
            />
          </div>

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
                <Select 
                  value={courseForm.level} 
                  onValueChange={(value) => setCourseForm(prev => ({ ...prev, level: value }))}
                >
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
                  onChange={(departments) => setCourseForm(prev => ({ ...prev, departamentoVisibilidade: departments }))}
                  initialSelected={courseForm.departamentoVisibilidade}
                  showLabel={false}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Configurações Avançadas */}
          <div className="space-y-4">
            <h4 className="font-medium">Configurações do Curso</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="allow-download" className="text-sm font-medium">
                    Permitir download de materiais
                  </Label>
                  <p className="text-xs text-gray-500">
                    Alunos poderão baixar os materiais das aulas
                  </p>
                </div>
                <Switch
                  id="allow-download"
                  checked={courseForm.allowDownload}
                  onCheckedChange={(checked) => setCourseForm(prev => ({ ...prev, allowDownload: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="certificate-enabled" className="text-sm font-medium">
                    Emitir certificado de conclusão
                  </Label>
                  <p className="text-xs text-gray-500">
                    Certificado será gerado automaticamente ao concluir
                  </p>
                </div>
                <Switch
                  id="certificate-enabled"
                  checked={courseForm.certificateEnabled}
                  onCheckedChange={(checked) => setCourseForm(prev => ({ ...prev, certificateEnabled: checked }))}
                />
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
                  onChange={(e) => setCourseForm(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!courseForm.title || !courseForm.description || !courseForm.category}
            className="bg-red-600 hover:bg-red-700"
          >
            {isEditing ? (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Atualizar Curso
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Criar Curso
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCourseDialog;