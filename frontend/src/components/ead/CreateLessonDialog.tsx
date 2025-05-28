import React from 'react';
import { Upload, X, Plus, Play, Edit, Trash2 } from 'lucide-react';
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

interface CreateLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCourse: {
    title: string;
    _id?: string;
  } | null;
  lessonForm: {
    _id?: string;
    title: string;
    description: string;
    type: string;
    content: string;
    videoUrl: string;
    videoFile: File | null;
    duration: string;
    order: number;
    isPublished: boolean;
    materials: any[];
  };
  setLessonForm: React.Dispatch<React.SetStateAction<any>>;
  onCreateLesson: () => void;
  onUpdateLesson?: () => void;
  onDeleteLesson?: () => void;
  isEditing?: boolean;
}

const CreateLessonDialog: React.FC<CreateLessonDialogProps> = ({
  open,
  onOpenChange,
  selectedCourse,
  lessonForm,
  setLessonForm,
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
  isEditing = false
}) => {
  const handleSave = () => {
    if (isEditing && onUpdateLesson) {
      onUpdateLesson();
    } else {
      onCreateLesson();
    }
  };

  const handleDelete = () => {
    if (onDeleteLesson && confirm('Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.')) {
      onDeleteLesson();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isEditing ? 'Editar Aula' : 'Adicionar Nova Aula'}</span>
            {isEditing && onDeleteLesson && (
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
              ? `Edite a aula "${lessonForm.title}"`
              : `Adicione uma nova aula ao curso "${selectedCourse?.title}"`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Status de Publicação */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="lesson-published" className="text-base font-medium">
                Aula Publicada
              </Label>
              <p className="text-sm text-gray-500">
                Quando ativada, a aula ficará visível para os alunos
              </p>
            </div>
            <Switch
              id="lesson-published"
              checked={lessonForm.isPublished}
              onCheckedChange={(checked) => setLessonForm(prev => ({ ...prev, isPublished: checked }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="lesson-order">Ordem</Label>
              <Input
                id="lesson-order"
                type="number"
                min="1"
                value={lessonForm.order}
                onChange={(e) => setLessonForm(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                placeholder="1"
                className="mt-1"
              />
            </div>
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
              <Select 
                value={lessonForm.type} 
                onValueChange={(value) => setLessonForm(prev => ({ 
                  ...prev, 
                  type: value,
                  videoUrl: value !== 'video' ? '' : prev.videoUrl,
                  videoFile: value !== 'video' ? null : prev.videoFile,
                  content: value === 'text' ? prev.content : ''
                }))}
              >
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
          
          {lessonForm.type === 'text' && (
            <div>
              <Label htmlFor="lesson-content">Conteúdo da Aula</Label>
              <Textarea
                id="lesson-content"
                value={lessonForm.content}
                onChange={(e) => setLessonForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Digite o conteúdo textual da aula..."
                className="mt-1"
                rows={6}
              />
            </div>
          )}
          
          {lessonForm.type === 'video' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="video-url">URL do Vídeo (YouTube, Vimeo, etc.)</Label>
                <Input
                  id="video-url"
                  type="url"
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value, videoFile: null }))}
                  placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                  className="mt-1"
                />
              </div>
              
              <div className="text-center text-gray-500">ou</div>
              
              <div>
                <Label htmlFor="video-file">Upload de Vídeo Local</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {lessonForm.videoFile ? (
                    <div className="space-y-2">
                      <Play className="h-8 w-8 mx-auto text-blue-500" />
                      <p className="text-sm font-medium">{lessonForm.videoFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(lessonForm.videoFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLessonForm(prev => ({ ...prev, videoFile: null }))}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Arraste um vídeo aqui ou clique para selecionar
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        MP4, AVI, MOV, WebM (máx. 500MB)
                      </p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validar tamanho do arquivo (500MB)
                            if (file.size > 500 * 1024 * 1024) {
                              alert('Vídeo muito grande. Máximo 500MB.');
                              return;
                            }
                            setLessonForm(prev => ({ ...prev, videoFile: file, videoUrl: '' }));
                          }
                        }}
                        className="hidden"
                        id="video-file"
                      />
                      <label
                        htmlFor="video-file"
                        className="mt-2 inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
                      >
                        Selecionar Vídeo
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {lessonForm.type === 'quiz' && (
            <div className="p-4 border rounded-lg bg-blue-50">
              <p className="text-sm text-blue-600">
                <strong>Funcionalidade em desenvolvimento:</strong> O editor de quiz será implementado em breve. 
                Por enquanto, você pode usar o tipo "Texto" para criar questionários manuais.
              </p>
            </div>
          )}
          
          {lessonForm.type === 'assignment' && (
            <div>
              <Label htmlFor="assignment-content">Instruções da Tarefa</Label>
              <Textarea
                id="assignment-content"
                value={lessonForm.content}
                onChange={(e) => setLessonForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Descreva as instruções para a tarefa que os alunos devem realizar..."
                className="mt-1"
                rows={4}
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!lessonForm.title || (lessonForm.type === 'video' && !lessonForm.videoUrl && !lessonForm.videoFile)}
            className="bg-red-600 hover:bg-red-700"
          >
            {isEditing ? (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Atualizar Aula
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Aula
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLessonDialog;