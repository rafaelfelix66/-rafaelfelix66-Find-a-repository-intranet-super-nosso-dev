// verify-oracle-requirements.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('🔍 Verificação Completa de Requisitos para Conexão Oracle\n');

// Função para verificar arquitetura
function checkArchitecture() {
  console.log('1. Verificação de Arquitetura:');
  const arch = process.arch;
  const nodeVersion = process.version;
  
  console.log(`   - Arquitetura do Node.js: ${arch}`);
  console.log(`   - Versão do Node.js: ${nodeVersion}`);
  
  return arch === 'x64';
}

// Verificar instalação do Oracle Client
function checkOracleClient() {
  console.log('\n2. Verificação do Oracle Client:');
  
  const possiblePaths = [
    'C:\\oracle\\product\\11.2.0\\client_1',
    'C:\\Oracle\\instantclient_21_9',
    'C:\\Oracle\\instantclient_11_2_x64',
    path.join(os.homedir(), 'Oracle', 'instantclient')
  ];

  let clientFound = false;
  let clientPath = null;

  possiblePaths.forEach(p => {
    const dllPath = path.join(p, 'oci.dll');
    if (fs.existsSync(dllPath)) {
      console.log(`   ✅ Oracle Client encontrado em: ${p}`);
      console.log(`   - Arquivo OCI: ${dllPath}`);
      clientFound = true;
      clientPath = p;
    }
  });

  if (!clientFound) {
    console.log('   ❌ Nenhum Oracle Client encontrado');
    console.log('   Locais verificados:');
    possiblePaths.forEach(p => console.log(`   - ${p}`));
  }

  return { clientFound, clientPath };
}

// Verificar variáveis de ambiente
function checkEnvironmentVariables() {
  console.log('\n3. Verificação de Variáveis de Ambiente:');
  
  const requiredVars = [
    'ORACLE_HOME',
    'TNS_ADMIN',
    'PATH'
  ];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName} configurado`);
      console.log(`   - Valor: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
    } else {
      console.log(`   ⚠️ ${varName} NÃO configurado`);
    }
  });
}

// Verificar dependências npm
function checkNpmDependencies() {
  console.log('\n4. Verificação de Dependências npm:');
  
  try {
    const packageJson = require('./package.json');
    const dependencies = packageJson.dependencies || {};
    
    const requiredDeps = ['oracledb', 'dotenv'];
    
    requiredDeps.forEach(dep => {
      if (dependencies[dep]) {
        console.log(`   ✅ ${dep} instalado (Versão: ${dependencies[dep]})`);
      } else {
        console.log(`   ❌ ${dep} NÃO instalado`);
      }
    });
  } catch (error) {
    console.log('   ❌ Erro ao verificar package.json');
    console.error(error);
  }
}

// Verificar conectividade de rede
function checkNetworkConnectivity() {
  console.log('\n5. Verificação de Conectividade de Rede:');
  
  const hosts = [
    'jersey.supernosso.intra',
    'localhost'
  ];

  hosts.forEach(host => {
    try {
      const result = execSync(`ping -c 4 ${host}`, { encoding: 'utf-8' });
      console.log(`   ✅ Ping para ${host} bem-sucedido`);
    } catch (error) {
      console.log(`   ❌ Falha no ping para ${host}`);
    }
  });
}

// Verificar arquivo .env
function checkEnvFile() {
  console.log('\n6. Verificação do Arquivo .env:');
  
  const envPath = path.resolve(__dirname, '.env');
  
  if (fs.existsSync(envPath)) {
    console.log(`   ✅ Arquivo .env encontrado: ${envPath}`);
    
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const hasOracleCredentials = 
      envContent.includes('ORACLE_USER=') && 
      envContent.includes('ORACLE_PASSWORD=') && 
      envContent.includes('ORACLE_CONNECTION_STRING=');
    
    if (hasOracleCredentials) {
      console.log('   ✅ Credenciais Oracle encontradas no .env');
    } else {
      console.log('   ⚠️ Credenciais Oracle INCOMPLETAS no .env');
    }
  } else {
    console.log('   ❌ Arquivo .env NÃO encontrado');
  }
}

// Função principal
function main() {
  console.log('🔬 Verificação Completa de Ambiente Oracle\n');
  
  const archOk = checkArchitecture();
  const { clientFound, clientPath } = checkOracleClient();
  checkEnvironmentVariables();
  checkNpmDependencies();
  checkNetworkConnectivity();
  checkEnvFile();

  console.log('\n📋 Resumo:');
  console.log(`   - Arquitetura compatível: ${archOk ? '✅' : '❌'}`);
  console.log(`   - Oracle Client encontrado: ${clientFound ? '✅' : '❌'}`);
  
  if (clientPath) {
    console.log(`   - Caminho do Cliente: ${clientPath}`);
  }
}

main();