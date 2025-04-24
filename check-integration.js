// Script para verificar a integração do frontend com o backend
// Salve este arquivo como check-integration.js e execute com node check-integration.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Verificando a integração do frontend com o backend...');

// Verificar se os diretórios necessários existem
const checkDirectories = () => {
  const requiredDirs = [
    './backend/uploads',
    './backend/uploads/chat',
    './backend/uploads/files',
    './backend/uploads/knowledge',
  ];

  const missingDirs = [];
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      missingDirs.push(dir);
    }
  }

  if (missingDirs.length > 0) {
    console.error('❌ Diretórios ausentes:');
    missingDirs.forEach(dir => console.error(`   - ${dir}`));
    console.log('📋 Criando diretórios ausentes...');
    
    missingDirs.forEach(dir => {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   ✅ Diretório ${dir} criado com sucesso.`);
    });
  } else {
    console.log('✅ Diretórios de upload existem.');
  }
};

// Verificar configuração do .env
const checkEnvFile = () => {
  const envPath = './.env';
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env não encontrado.');
    console.log('📋 Criando arquivo .env padrão...');
    
    const envContent = `MONGODB_URI=mongodb://admin:senhasegura123@mongodb:27017/intranet?authSource=admin
JWT_SECRET=Rr35778213*
PORT=3000`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Arquivo .env criado com sucesso.');
  } else {
    console.log('✅ Arquivo .env encontrado.');
    
    // Verificar se as variáveis necessárias estão presentes
    const envContent = fs.readFileSync(envPath, 'utf8');
    const missingVars = [];
    
    if (!envContent.includes('MONGODB_URI=')) missingVars.push('MONGODB_URI');
    if (!envContent.includes('JWT_SECRET=')) missingVars.push('JWT_SECRET');
    if (!envContent.includes('PORT=')) missingVars.push('PORT');
    
    if (missingVars.length > 0) {
      console.error(`❌ Variáveis ausentes no .env: ${missingVars.join(', ')}`);
    }
  }
};

// Verificar configuração do Cors
const checkCorsConfiguration = () => {
  const serverPath = './backend/server.js';
  if (!fs.existsSync(serverPath)) {
    console.error('❌ Arquivo server.js não encontrado.');
    return;
  }
  
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  if (!serverContent.includes('cors(')) {
    console.error('❌ Configuração CORS não encontrada no server.js.');
    console.log('📋 Você deve adicionar a configuração CORS correta ao arquivo server.js');
  } else {
    console.log('✅ Configuração CORS encontrada.');
  }
};

// Verificar configuração do Multer para uploads
const checkMulterConfiguration = () => {
  const timelineRoutePath = './backend/routes/timeline.js';
  const filesRoutePath = './backend/routes/files.js';
  
  let hasIssues = false;
  
  if (fs.existsSync(timelineRoutePath)) {
    const timelineContent = fs.readFileSync(timelineRoutePath, 'utf8');
    if (!timelineContent.includes('multer')) {
      console.error('❌ Configuração Multer não encontrada em routes/timeline.js.');
      hasIssues = true;
    }
    
    if (!timelineContent.includes('upload.array')) {
      console.error('❌ Configuração upload.array para anexos não encontrada em routes/timeline.js.');
      hasIssues = true;
    }
  } else {
    console.error('❌ Arquivo routes/timeline.js não encontrado.');
    hasIssues = true;
  }
  
  if (fs.existsSync(filesRoutePath)) {
    const filesContent = fs.readFileSync(filesRoutePath, 'utf8');
    if (!filesContent.includes('multer')) {
      console.error('❌ Configuração Multer não encontrada em routes/files.js.');
      hasIssues = true;
    }
  } else {
    console.error('❌ Arquivo routes/files.js não encontrado.');
    hasIssues = true;
  }
  
  if (!hasIssues) {
    console.log('✅ Configuração Multer para uploads parece correta.');
  }
};

// Verificar configurações de Frontend para API
const checkFrontendApiConfig = () => {
  const apiServicePath = './frontend/src/services/api.ts';
  if (!fs.existsSync(apiServicePath)) {
    console.error('❌ Arquivo de serviço API não encontrado em frontend/src/services/api.ts.');
    return;
  }
  
  const apiContent = fs.readFileSync(apiServicePath, 'utf8');
  
  if (!apiContent.includes('API_BASE_URL')) {
    console.error('❌ Configuração API_BASE_URL não encontrada no serviço de API.');
  } else {
    console.log('✅ Configuração API_BASE_URL encontrada no serviço de API.');
  }
  
  if (!apiContent.includes('upload:')) {
    console.error('❌ Método upload não encontrado no serviço de API.');
    console.log('📋 Adicione um método para uploads de arquivo ao serviço de API');
  } else {
    console.log('✅ Método upload encontrado no serviço de API.');
  }
};

// Verificar configuração de proxy no nginx
const checkNginxConfig = () => {
  const nginxConfigPath = './nginx/nginx.conf';
  if (!fs.existsSync(nginxConfigPath)) {
    console.error('❌ Arquivo de configuração nginx não encontrado.');
    return;
  }
  
  const nginxContent = fs.readFileSync(nginxConfigPath, 'utf8');
  
  let hasIssues = false;
  
  if (!nginxContent.includes('location /api')) {
    console.error('❌ Configuração de proxy para /api não encontrada no nginx.conf.');
    hasIssues = true;
  }
  
  if (!nginxContent.includes('location /uploads')) {
    console.error('❌ Configuração de proxy para /uploads não encontrada no nginx.conf.');
    hasIssues = true;
  }
  
  if (!nginxContent.includes('location /socket.io')) {
    console.error('❌ Configuração de proxy para /socket.io não encontrada no nginx.conf.');
    hasIssues = true;
  }
  
  if (!hasIssues) {
    console.log('✅ Configuração de proxy no nginx parece correta.');
  }
};

// Verificar docker-compose.yml
const checkDockerCompose = () => {
  const dockerComposePath = './docker-compose.yml';
  if (!fs.existsSync(dockerComposePath)) {
    console.error('❌ Arquivo docker-compose.yml não encontrado.');
    return;
  }
  
  const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');
  
  let hasIssues = false;
  
  if (!dockerComposeContent.includes('mongodb:')) {
    console.error('❌ Serviço MongoDB não encontrado no docker-compose.yml.');
    hasIssues = true;
  }
  
  if (!dockerComposeContent.includes('backend:')) {
    console.error('❌ Serviço Backend não encontrado no docker-compose.yml.');
    hasIssues = true;
  }
  
  if (!dockerComposeContent.includes('frontend:')) {
    console.error('❌ Serviço Frontend não encontrado no docker-compose.yml.');
    hasIssues = true;
  }
  
  if (!dockerComposeContent.includes('volumes:')) {
    console.error('❌ Volumes não encontrados no docker-compose.yml.');
    hasIssues = true;
  }
  
  if (!hasIssues) {
    console.log('✅ Configuração docker-compose.yml parece correta.');
  }
};

// Verificar conexão com o MongoDB
const checkMongoConnection = () => {
  console.log('🔍 Verificando conexão com o MongoDB...');
  
  try {
    const result = execSync('docker exec -i intranet-mongodb mongosh --eval "db.runCommand({ping:1})"', { encoding: 'utf8' });
    if (result.includes('ok: 1')) {
      console.log('✅ Conexão com o MongoDB está funcionando.');
    } else {
      console.error('❌ Não foi possível verificar a conexão com o MongoDB.');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar a conexão com o MongoDB. O container pode não estar rodando.');
    console.log('📋 Execute docker-compose up -d antes de executar este script.');
  }
};

// Executar verificações
(async () => {
  console.log('🔍 Iniciando verificações...\n');
  
  checkDirectories();
  console.log('');
  
  checkEnvFile();
  console.log('');
  
  checkCorsConfiguration();
  console.log('');
  
  checkMulterConfiguration();
  console.log('');
  
  checkFrontendApiConfig();
  console.log('');
  
  checkNginxConfig();
  console.log('');
  
  checkDockerCompose();
  console.log('');
  
  // Esta verificação só funciona se os contêineres estiverem em execução
  checkMongoConnection();
  console.log('');
  
  console.log('✅ Verificações concluídas! Corrija os problemas identificados antes de continuar.');
  console.log('📋 Depois de corrigir os problemas, reinicie os contêineres com:');
  console.log('   docker-compose down && docker-compose up -d');
})();