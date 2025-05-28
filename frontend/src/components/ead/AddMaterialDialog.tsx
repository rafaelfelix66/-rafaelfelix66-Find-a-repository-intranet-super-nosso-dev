//src/components/ead/AddMaterialDialog.tsx
import React from 'react';
import { Upload, X, Plus, FileText, Play, Image, Link2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Material {
  id?: number;
  name: string;
  type: string;
  file?: File | null;
  url?: string;
  size?: string;
}

interface AddMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLesson: {
    title: string;
    _id?: string;
  } | null;
  materialForm: {
    name: string;
    type: string;
    file: File | null;
    url: string;
  };
  setMaterialForm: React.Dispatch<React.SetStateAction<any>>;
  onAddMaterial: () => void;
}

const AddMaterialDialog: React.FC<AddMaterialDialogProps> = ({
  open,
  onOpenChange,
  selectedLesson,
  materialForm,
  setMaterialForm,
  onAddMaterial
}) => {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'video': return <Play className="h-4 w-4 text-blue-500" />;
      case 'document': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'image': return <Image className="h-4 w-4 text-green-500" />;
      case 'link': return <Link2 className="h-4 w-4 text-purple-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const resetForm = () => {
    setMaterialForm({
      name: '',
      type: 'pdf',
      file: null,
      url: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
              onValueChange={(value) => setMaterialForm(prev => ({ ...prev, type: value, file: null, url: '' }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="document">Documento (Word, Excel, etc.)</SelectItem>
                <SelectItem value="image">Imagem</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="link">Link Externo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {materialForm.type === 'link' ? (
            <div>
              <Label htmlFor="material-url">URL do Link *</Label>
              <Input
                id="material-url"
                type="url"
                value={materialForm.url}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://exemplo.com"
                className="mt-1"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="material-file">Arquivo *</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {materialForm.file ? (
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      {getFileIcon(materialForm.type)}
                    </div>
                    <p className="text-sm font-medium">{materialForm.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(materialForm.file.size / 1024 / 1024).toFixed(2)} MB
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
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo 50MB
                    </p>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validar tamanho do arquivo (50MB)
                          if (file.size > 50 * 1024 * 1024) {
                            alert('Arquivo muito grande. Máximo 50MB.');
                            return;
                          }
                          setMaterialForm(prev => ({ ...prev, file }));
                        }
                      }}
                      className="hidden"
                      id="material-file"
                      accept={
                        materialForm.type === 'pdf' ? '.pdf' :
                        materialForm.type === 'image' ? 'image/*' :
                        materialForm.type === 'video' ? 'video/*' :
                        materialForm.type === 'document' ? '.doc,.docx,.xls,.xlsx,.ppt,.pptx' :
                        '*'
                      }
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
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={onAddMaterial}
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
};

export default AddMaterialDialog;