//src\components\timeline\DepartamentoSelector.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Componente para seleção de departamentos na criação de posts
const DepartamentoSelector = ({ onChange }) => {
  const [selectedDepartments, setSelectedDepartments] = useState(['TODOS']);
  const [selectAll, setSelectAll] = useState(true);

  const departamentos = [
    'A CLASSIFICAR',
    'ADMINISTRATIVA', 
    'ADMINISTRATIVO', 
    'LIDERANÇA', 
    'OPERACIONAL'
  ];

  const handleToggleAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedDepartments(['TODOS']);
      onChange(['TODOS']);
    } else {
      setSelectedDepartments([]);
      onChange([]);
    }
  };

  const handleToggleDepartment = (dept) => {
    let newSelected;
    
    if (selectedDepartments.includes(dept)) {
      newSelected = selectedDepartments.filter(d => d !== dept);
    } else {
      newSelected = [...selectedDepartments, dept];
    }

    // Se não houver departamentos selecionados, volta para TODOS
    if (newSelected.length === 0) {
      newSelected = ['TODOS'];
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }

    setSelectedDepartments(newSelected);
    onChange(newSelected);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base">Visibilidade do Post</Label>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="todos-departamentos"
          checked={selectAll}
          onCheckedChange={handleToggleAll}
        />
        <Label
          htmlFor="todos-departamentos"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Todos os departamentos
        </Label>
      </div>

      {!selectAll && (
        <div className="grid grid-cols-2 gap-3">
          {departamentos.map((dept) => (
            <div key={dept} className="flex items-center space-x-2">
              <Checkbox
                id={`dept-${dept}`}
                checked={selectedDepartments.includes(dept)}
                onCheckedChange={() => handleToggleDepartment(dept)}
              />
              <Label
                htmlFor={`dept-${dept}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {dept}
              </Label>
            </div>
          ))}
        </div>
      )}

      {selectedDepartments.length > 0 && selectedDepartments[0] !== 'TODOS' && (
        <p className="text-sm text-gray-500">
          {selectedDepartments.length} departamento(s) selecionado(s)
        </p>
      )}
    </div>
  );
};

export default DepartamentoSelector;