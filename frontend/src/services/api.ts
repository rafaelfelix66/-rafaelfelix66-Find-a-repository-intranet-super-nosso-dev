// src/services/api.ts
// Melhorias para tratamento de erros e debug

// Detectar automaticamente o ambiente e usar o host adequado
export const getBaseUrl = () => {
  // Em produção, usamos o proxy configurado no nginx
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  
  // Em desenvolvimento local, conectamos diretamente ao backend
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getBaseUrl();

export const api = {
  getBaseUrl,
  
  get: async (endpoint: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Accept': 'application/json'
      };
      
      // Adicionar token se disponível (alguns endpoints podem ser públicos)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Erro na requisição GET:', error);
      throw error;
    }
  },
  
  post: async (endpoint: string, data: any, isFormData = false) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      
      const body = isFormData ? data : JSON.stringify(data);
      
      console.log(`Enviando para ${API_BASE_URL}${endpoint}:`, 
        isFormData ? 'FormData content' : data);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Erro na requisição POST:', error);
      throw error;
    }
  },
  
  put: async (endpoint: string, data: any = {}, isFormData = false) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      
      const body = isFormData ? data : JSON.stringify(data);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Erro na requisição PUT:', error);
      throw error;
    }
  },
  
  delete: async (endpoint: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      console.log(`Enviando DELETE para ${API_BASE_URL}${endpoint}`);
      
      // Mostrar o token parcialmente para debug (ocultando a maior parte)
      const tokenDebug = token.substring(0, 10) + '...' + token.substring(token.length - 5);
      console.log(`Token usado: ${tokenDebug}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'x-auth-token': token // Adicionando em ambos os formatos para compatibilidade
        }
      });
      
      // Tentar obter o corpo da resposta, que pode ter detalhes do erro
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error(`Erro ${response.status}:`, responseText);
        
        // Tentar analisar o texto como JSON se possível
        let errorDetail;
        try {
          errorDetail = JSON.parse(responseText);
        } catch (e) {
          errorDetail = responseText;
        }
        
        throw new Error(`Erro na requisição: ${response.status} - ${JSON.stringify(errorDetail)}`);
      }
      
      // Tentar analisar o texto como JSON
      try {
        return responseText ? JSON.parse(responseText) : { success: true };
      } catch (e) {
        // Se não for JSON válido, simplesmente retorne o sucesso
        return { success: true, message: responseText };
      }
    } catch (error) {
      console.error('Erro na requisição DELETE:', error);
      throw error;
    }
  },
  
  deletePost: async (postId: string) => {
    try {
      // Melhor tratamento de erros com mensagens mais detalhadas
      console.log(`Iniciando exclusão do post ${postId}`);
      const response = await api.delete(`/timeline/${postId}`);
      console.log(`Post ${postId} excluído com sucesso:`, response);
      return response;
    } catch (error) {
      console.error('Erro ao excluir post:', error);
      // Repassar o erro para ser tratado pelo componente
      throw error instanceof Error 
        ? error
        : new Error('Erro desconhecido ao excluir a publicação');
    }
  },
  
  upload: async (endpoint: string, formData: FormData) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      console.log(`Enviando upload para ${API_BASE_URL}${endpoint}`);
      
      // Log detalhado do FormData
      const formDataContent = {};
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          formDataContent[key] = `File: ${value.name} (${value.type}, ${value.size} bytes)`;
        } else {
          formDataContent[key] = value;
        }
      }
      console.log('FormData contém:', formDataContent);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token  // Adicionando em ambos os formatos para compatibilidade
          // Não definir Content-Type, deixar o navegador definir com o boundary
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Erro na requisição de upload:', error);
      throw error;
    }
  },

  uploadPut: async (endpoint: string, formData: FormData) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      console.log(`Enviando upload PUT para ${API_BASE_URL}${endpoint}`);
      console.log('FormData contém arquivos:', formData.getAll('image').length);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',  // Mudamos para PUT
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token  // Adicionando em ambos os formatos para compatibilidade
          // Não definimos Content-Type aqui
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        throw new Error(`Erro no upload: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Erro na requisição de upload:', error);
      throw error;
    }
  },
  
  // Funções específicas para banners
  banners: {
    getAll: async () => {
      return api.get('/banners/all');
    },
    
    getActive: async () => {
      return api.get('/banners');
    },
    
    create: async (formData: FormData) => {
      return api.upload('/banners', formData);
    },
    
    update: async (id: string, formData: FormData) => {
      // Para PUT com FormData usando a função upload modificada
      const response = await fetch(`${API_BASE_URL}/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-auth-token': localStorage.getItem('token')
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        throw new Error(`Erro na atualização do banner: ${response.status}`);
      }
      
      return response.json();
    },
    
    delete: async (id: string) => {
      return api.delete(`/banners/${id}`);
    },
    
    changeOrder: async (id: string, newOrder: number) => {
      return api.put(`/banners/${id}`, { order: newOrder });
    },
    
    toggleActive: async (id: string, isActive: boolean) => {
      return api.put(`/banners/${id}`, { active: isActive });
    }
  },
  
  // Funções específicas para links úteis
	usefulLinks: {
	  getAll: async () => {
		return api.get('/useful-links');
	  },
	  
	  getById: async (id: string) => {
		return api.get(`/useful-links/${id}`);
	  },
	  
	  create: async (linkData: any) => {
		return api.post('/useful-links', linkData);
	  },
	  
	  update: async (id: string, linkData: any) => {
		return api.put(`/useful-links/${id}`, linkData);
	  },
	  
	  delete: async (id: string) => {
		return api.delete(`/useful-links/${id}`);
	  },
	  
	  getCategories: async () => {
		return api.get('/useful-links/categories');
	  },
	  
	  reorder: async (links: { id: string; order: number }[]) => {
		return api.put('/useful-links/reorder/links', { links });
	  }
	},
	// Adicionar esta função no objeto api:
		downloadMaterial: async (courseId: string, materialId: string, materialName?: string) => {
		  try {
			const token = localStorage.getItem('token');
			if (!token) {
			  throw new Error('Usuário não autenticado');
			}
			
			const response = await fetch(`${API_BASE_URL}/courses/${courseId}/materials/${materialId}/download`, {
			  method: 'GET',
			  headers: {
				'Authorization': `Bearer ${token}`,
				'x-auth-token': token
			  }
			});
			
			if (!response.ok) {
			  const errorText = await response.text();
			  console.error(`Erro ${response.status}:`, errorText);
			  throw new Error(`Erro no download: ${response.status}`);
			}
			
			// Obter o blob da resposta
			const blob = await response.blob();
			
			// Determinar nome do arquivo
			let downloadFileName = materialName || 'material';
			
			// Tentar obter nome do cabeçalho Content-Disposition
			const contentDisposition = response.headers.get('Content-Disposition');
			if (contentDisposition) {
			  const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
			  if (fileNameMatch && fileNameMatch[1]) {
				downloadFileName = fileNameMatch[1];
			  }
			}
			
			// Criar URL para o blob e fazer download
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = downloadFileName;
			
			// Adicionar ao DOM, clicar e remover
			document.body.appendChild(link);
			link.click();
			
			// Cleanup
			setTimeout(() => {
			  document.body.removeChild(link);
			  window.URL.revokeObjectURL(url);
			}, 100);
			
			return { success: true, filename: downloadFileName };
		  } catch (error) {
			console.error('Erro no download do material:', error);
			throw error;
		  }
		}
};