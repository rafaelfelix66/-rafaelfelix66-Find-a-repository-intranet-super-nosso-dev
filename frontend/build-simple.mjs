//frontend/build-simple.mjs
// Script para preparar e construir a versão simplificada da aplicação
import fs from 'fs';
import { execSync } from 'child_process';

console.log('=== Preparando build da versão simplificada ===');

try {
  // 1. Backup dos arquivos originais
  console.log('Fazendo backup dos arquivos originais...');
  if (fs.existsSync('./src/main.tsx')) {
    fs.copyFileSync('./src/main.tsx', './src/main.tsx.bak');
  }
  if (fs.existsSync('./src/App.tsx')) {
    fs.copyFileSync('./src/App.tsx', './src/App.tsx.bak');
  }
  if (fs.existsSync('./index.html')) {
    fs.copyFileSync('./index.html', './index.html.bak');
  }

  // 2. Substituir pelos arquivos simplificados
  console.log('Substituindo pelos arquivos simplificados...');
  fs.copyFileSync('./src/main-simple.tsx', './src/main.tsx');
  fs.copyFileSync('./src/App-simple.tsx', './src/App.tsx');
  fs.copyFileSync('./index-simple.html', './index.html');

  // 3. Executar o build
  console.log('Executando build...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('=== Build da versão simplificada concluído com sucesso! ===');
  console.log('\nAgora você pode reiniciar os containers Docker:');
  console.log('  docker-compose down');
  console.log('  docker-compose up -d');
  console.log('\nEm seguida, acesse http://127.0.0.1 no navegador.');

} catch (error) {
  console.error('Erro durante a preparação ou build:', error);
} finally {
  // 4. Restaurar os arquivos originais
  console.log('\nRestaurando arquivos originais...');
  if (fs.existsSync('./src/main.tsx.bak')) {
    fs.copyFileSync('./src/main.tsx.bak', './src/main.tsx');
    fs.unlinkSync('./src/main.tsx.bak');
  }
  if (fs.existsSync('./src/App.tsx.bak')) {
    fs.copyFileSync('./src/App.tsx.bak', './src/App.tsx');
    fs.unlinkSync('./src/App.tsx.bak');
  }
  if (fs.existsSync('./index.html.bak')) {
    fs.copyFileSync('./index.html.bak', './index.html');
    fs.unlinkSync('./index.html.bak');
  }
  console.log('Arquivos originais restaurados.');
}