import React from 'react';
import { Upload, X, Plus, Play } from 'lucide-react';
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

interface CreateLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCourse: {
    title: string;
  } | null;
  lessonForm: {
    title: string;
    description: string;
    type: string;
    videoUrl: string;
    videoFile: File | null;
    duration: string;
    thumbnail: File | null;
    materials: any[];
  };
  setLessonForm: React.Dispatch<React.SetStateAction<any>>;
  onCreateLesson: () => void;
}

const CreateLessonDialog: React.FC<CreateLessonDialogProps> = ({
  open,
  onOpenChange,
  selectedCourse,
  lessonForm,
  setLessonForm,
  onCreateLesson
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Aula</DialogTitle>
          <DialogDescription>
            Adicione uma nova aula ao curso "{selectedCourse?.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Upload de Thumbnail da Aula */}
          <div>
            <Label htmlFor="lesson-thumbnail">Imagem de Capa da Aula</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {lessonForm.thumbnail ? (
                <div className="space-y-2">
                  <img 
                    src={URL.createObjectURL(lessonForm.thumbnail)} 
                    alt="Preview" 
                    className="mx-auto h-24 w-auto rounded"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLessonForm(prev => ({ ...prev, thumbnail: null }))}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Imagem opcional</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLessonForm(prev => ({ ...prev, thumbnail: file }));
                      }
                    }}
                    className="hidden"
                    id="lesson-thumbnail"
                  />
                  <label
                    htmlFor="lesson-thumbnail"
                    className="mt-2 inline-block px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer text-sm"
                  >
                    Selecionar
                  </label>
                </div>
              )}
            </div>
          </div>

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
              <Select 
                value={lessonForm.type} 
                onValueChange={(value) => setLessonForm(prev => ({ ...prev, type: value }))}
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
          
          {lessonForm.type === 'video' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="video-url">URL do Vídeo (YouTube, Vimeo, etc.)</Label>
                <Input
                  id="video-url"
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
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
                        MP4, AVI, MOV (máx. 500MB)
                      </p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLessonForm(prev => ({ ...prev, videoFile: file }));
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
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={onCreateLesson}
            disabled={!lessonForm.title}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Aula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLessonDialog;