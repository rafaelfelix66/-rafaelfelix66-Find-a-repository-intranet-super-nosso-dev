// services/updateBackupService.js
const oracledb = require('oracledb');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Função para detectar o Oracle Client e verificar se existe
function findOracleClient() {
  const possiblePaths = [
    '/opt/oracle/instantclient_23_8',
    '/opt/oracle/instantclient_23_7',
    '/opt/oracle/instantclient_23_6'
  ];

  console.log('🔍 Procurando Oracle Client...');
  
  for (const clientPath of possiblePaths) {
    // Verificar se o diretório existe
    try {
      const fs = require('fs');
      if (fs.existsSync(clientPath)) {
        console.log(`📁 Diretório encontrado: ${clientPath}`);
        
        // Verificar se o libclntsh.so existe diretamente no diretório
        const libPath = path.join(clientPath, 'libclntsh.so');
        if (fs.existsSync(libPath)) {
          console.log(`✅ Oracle Client válido encontrado: ${clientPath}`);
          console.log(`✅ libclntsh.so confirmado: ${libPath}`);
          return clientPath;
        } else {
          console.log(`❌ libclntsh.so não encontrado em: ${libPath}`);
          
          // Listar o que há no diretório para debug
          try {
            const files = fs.readdirSync(clientPath);
            console.log(`📋 Arquivos em ${clientPath}:`, files.slice(0, 10));
          } catch (e) {
            console.log(`❌ Erro ao listar ${clientPath}:`, e.message);
          }
        }
      } else {
        console.log(`❌ Diretório não existe: ${clientPath}`);
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar ${clientPath}:`, err.message);
    }
  }
  
  console.log('❌ Oracle Client não encontrado em nenhum caminho conhecido');
  return null;
}

// Detectar Oracle Client
const oracleClientPath = findOracleClient();

// Inicializar Oracle Client se encontrado
let oracleInitialized = false;
if (oracleClientPath) {
  try {
    // Verificar se já foi inicializado
    if (oracledb.oracleClientVersion) {
      console.log('ℹ️ Oracle Client já estava inicializado');
      oracleInitialized = true;
    } else {
      console.log(`🔧 Inicializando Oracle Client: ${oracleClientPath}`);
      oracledb.initOracleClient({
        libDir: oracleClientPath
      });
      console.log('✅ Oracle Client inicializado com sucesso');
      oracleInitialized = true;
    }
  } catch (err) {
    if (err.message.includes('has already been initialized') || err.message.includes('DPI-1040')) {
      console.log('ℹ️ Oracle Client já estava inicializado (caught exception)');
      oracleInitialized = true;
    } else {
      console.error('❌ Erro ao inicializar Oracle Client:', err.message);
      oracleInitialized = false;
    }
  }
} else {
  console.error('❌ CRÍTICO: Oracle Client não encontrado - backup não funcionará');
  oracleInitialized = false;
}

// Configuração do Oracle
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING
};

// Caminho para o arquivo de backup
const BACKUP_FILE_PATH = path.join(__dirname, '../data/usuarios_backup.json');

// Garantir que o diretório existe
async function ensureBackupDirectoryExists() {
  const backupDir = path.dirname(BACKUP_FILE_PATH);
  try {
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`Diretório para backup garantido: ${backupDir}`);
  } catch (err) {
    console.error('Erro ao criar diretório:', err);
  }
}

// Ler arquivo de backup existente
async function readBackupFile() {
  try {
    const fileContent = await fs.readFile(BACKUP_FILE_PATH, 'utf8');
    return JSON.parse(fileContent);
  } catch (err) {
    console.log('Arquivo de backup não encontrado ou inválido, iniciando com array vazio');
    return [];
  }
}

// Salvar arquivo de backup
async function saveBackupFile(data) {
  try {
    await fs.writeFile(BACKUP_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('Arquivo de backup atualizado com sucesso');
  } catch (err) {
    console.error('Erro ao salvar arquivo de backup:', err);
    throw err;
  }
}

// Função principal para atualizar o backup
async function updateUserBackup() {
  let connection;
  
  try {
    console.log('Iniciando atualização do backup de usuários...');
    
    // Verificar se Oracle Client foi inicializado
    if (!oracleInitialized) {
      throw new Error('Oracle Client não foi inicializado corretamente. Verifique a instalação do Oracle Instant Client.');
    }
    
    // Garantir que o diretório existe
    await ensureBackupDirectoryExists();
    
    // Ler backup existente
    const existingUsers = await readBackupFile();
    //console.log(`Usuários existentes no backup: ${existingUsers.length}`);
    
    // Criar um Set de CPFs existentes para verificação rápida
    const existingCPFs = new Set(existingUsers.map(user => user.CPF));
    
    // Debug da configuração de conexão
    console.log('Conectando ao Oracle...');
    console.log(`Oracle Client Path: ${oracleClientPath}`);
    console.log(`Oracle Inicializado: ${oracleInitialized}`);
    console.log(`User: ${dbConfig.user}`);
    console.log(`Connection String: ${dbConfig.connectString}`);
    
    // Conectar ao Oracle
    connection = await oracledb.getConnection(dbConfig);
    console.log('Conexão Oracle estabelecida com sucesso');
    
    // Executar a query atualizada com todos os campos necessários
    const query = `
      SELECT 
        CHAPA,
        NOME,
        CPF,
        FUNCAO,
        SETOR,
        FILIAL,
        DATAADMISSAO,
        DTNASCIMENTO
      FROM CONSINCO.STAV_LOG_INTR 
      WHERE CPF IS NOT NULL
    `;
    
    console.log('Executando consulta no Oracle...');
    const result = await connection.execute(query, [], { 
      outFormat: oracledb.OUT_FORMAT_OBJECT 
    });
    
    //console.log(`Registros retornados do Oracle: ${result.rows.length}`);
    
    // Processar todos os usuários (novos e existentes)
    const updatedUsers = result.rows.filter(row => row.CPF).map(row => {
      // Procurar usuário existente no backup
      const existingUser = existingUsers.find(user => user.CPF === row.CPF);
      
      // Formatar datas
      const formatDate = (date) => {
        if (!date) return null;
        try {
          return date instanceof Date ? date.toISOString() : date;
        } catch (e) {
          return null;
        }
      };
      
      return {
        CHAPA: row.CHAPA || existingUser?.CHAPA || null,
        NOME: row.NOME || existingUser?.NOME || '',
        CPF: row.CPF,
        FUNCAO: row.FUNCAO || existingUser?.FUNCAO || '',
        SETOR: row.SETOR || existingUser?.SETOR || '',
        FILIAL: row.FILIAL || existingUser?.FILIAL || '',
        DATAADMISSAO: formatDate(row.DATAADMISSAO) || existingUser?.DATAADMISSAO || null,
        DTNASCIMENTO: formatDate(row.DTNASCIMENTO) || existingUser?.DTNASCIMENTO || null
      };
    });
    
    // Filtrar apenas usuários novos
    const newUsers = updatedUsers.filter(user => !existingCPFs.has(user.CPF));
    
    //console.log(`Novos usuários encontrados: ${newUsers.length}`);
    //console.log(`Usuários atualizados: ${updatedUsers.length}`);
    
    // Atualizar o arquivo com todos os dados
    await saveBackupFile(updatedUsers);
    
    if (newUsers.length > 0) {
      console.log('Novos usuários adicionados ao backup:');
      newUsers.forEach(user => {
        //console.log(`- ${user.NOME} (CPF: ${user.CPF}, Chapa: ${user.CHAPA})`);
      });
    }
    
    return {
      success: true,
      existingCount: existingUsers.length,
      newCount: newUsers.length,
      totalCount: updatedUsers.length,
      updatedCount: updatedUsers.length - newUsers.length
    };
    
  } catch (err) {
    console.error('Erro na atualização do backup:', err);
    
    // Debug adicional
    if (err.message.includes('DPI-1047')) {
      console.error('💡 Diagnóstico do erro DPI-1047:');
      console.error(`- Oracle Client Path detectado: ${oracleClientPath || 'NENHUM'}`);
      console.error(`- Oracle Client inicializado: ${oracleInitialized}`);
      
      // Verificar se o arquivo existe
      if (oracleClientPath) {
        try {
          const fs = require('fs');
          const libPath = path.join(oracleClientPath, 'libclntsh.so');
          const exists = fs.existsSync(libPath);
          console.error(`- libclntsh.so existe: ${exists ? 'SIM' : 'NÃO'} (${libPath})`);
          
          if (exists) {
            console.error('- O arquivo existe mas não pode ser carregado - problema de dependências');
            console.error('- Execute: ldd ' + libPath + ' | grep "not found"');
          }
        } catch (e) {
          console.error(`- Erro ao verificar arquivo: ${e.message}`);
        }
      }
    }
    
    return {
      success: false,
      error: err.message
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Conexão Oracle fechada');
      } catch (err) {
        console.error('Erro ao fechar conexão:', err);
      }
    }
  }
}

// Função para executar atualização manual
async function runManualUpdate() {
  console.log('=== ATUALIZAÇÃO MANUAL DO BACKUP INICIADA ===');
  console.log(`Horário: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`Oracle Client Path: ${oracleClientPath || 'NÃO ENCONTRADO'}`);
  console.log(`Oracle Inicializado: ${oracleInitialized}`);
  
  const result = await updateUserBackup();
  
  console.log('\n=== RESULTADO DA ATUALIZAÇÃO ===');
  if (result.success) {
    console.log(`✓ Atualização concluída com sucesso`);
    //console.log(`• Usuários existentes: ${result.existingCount}`);
    //console.log(`• Novos usuários: ${result.newCount}`);
    //console.log(`• Usuários atualizados: ${result.updatedCount}`);
    console.log(`• Total de usuários: ${result.totalCount}`);
  } else {
    console.log(`✗ Erro na atualização: ${result.error}`);
  }
  console.log('================================\n');
}

// Executar se o script for chamado diretamente
if (require.main === module) {
  runManualUpdate().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
}

module.exports = {
  updateUserBackup,
  runManualUpdate
};